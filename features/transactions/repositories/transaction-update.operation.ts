import { doc, runTransaction } from "firebase/firestore";

import { db } from "@/lib/firebase";
import { Wallet } from "@/features/wallets/types/wallet.types";
import { nextRevision } from "@/shared/utils/revision";
import {
  assertExpectedRevision,
  writeAppliedMutation,
  type SyncMutationContext,
} from "@/shared/services/sync/firestore-idempotency";

import { TransactionOperationError } from "../services/transaction.errors";
import { Transaction, UpdateTransactionDto } from "../types/transaction.types";
import { readTransactionReplay } from "./transaction-mutation.replay";
import { buildTransaction } from "./transaction-firestore.utils";
import { readStoredDeletedAt } from "./transaction-stored.utils";
import { applyTransactionUpdate } from "./transaction-update.apply";
import { buildTransactionUpdatePatch } from "./transaction-update.patch";
import { TransactionMutationResult } from "./transaction.repository";

export interface UpdateTransactionOperationOptions {
  ownerId: string;
  transactionId: string;
  dto: UpdateTransactionDto;
  /** Present only when the sync engine pushes a queued mutation. */
  mutation?: SyncMutationContext;
}

/**
 * Updates a transaction, reverting the stored movement from its original
 * wallet before applying the new one.
 */
export async function updateTransactionOperation({
  ownerId,
  transactionId,
  dto,
  mutation,
}: UpdateTransactionOperationOptions): Promise<TransactionMutationResult> {
  const now = new Date().toISOString();
  const transactionRef = doc(db, "transactions", transactionId);

  let updatedTransaction: Transaction | null = null;
  let updatedWallets: Wallet[] = [];
  let replayedWallets: Wallet[] = [];
  let replayed = false;

  await runTransaction(db, async (firestoreTransaction) => {
    if (mutation) {
      const replay = await readTransactionReplay(
        firestoreTransaction,
        transactionRef,
        ownerId,
        mutation,
      );
      if (replay.replayed) {
        replayed = true;
        updatedTransaction = replay.transaction;
        replayedWallets = replay.wallets;
        return;
      }
    }

    const transactionSnapshot = await firestoreTransaction.get(transactionRef);
    if (!transactionSnapshot.exists()) {
      throw new TransactionOperationError("TRANSACTION_NOT_FOUND");
    }

    const transactionData =
      transactionSnapshot.data() as Record<string, unknown>;
    if (transactionData.ownerId !== ownerId) {
      throw new TransactionOperationError("TRANSACTION_NOT_FOUND");
    }

    // A soft-deleted movement already reverted its amount; editing it would
    // apply the money again while it stays out of the history.
    if (readStoredDeletedAt(transactionData) !== null) {
      throw new TransactionOperationError("TRANSACTION_NOT_FOUND");
    }

    if (mutation) assertExpectedRevision(transactionData, mutation);

    updatedWallets = await applyTransactionUpdate(
      firestoreTransaction,
      ownerId,
      now,
      transactionData,
      dto,
    );

    const revision = nextRevision(transactionData);
    const patch = buildTransactionUpdatePatch(
      ownerId,
      transactionData,
      dto,
      revision,
      now,
    );

    firestoreTransaction.update(transactionRef, patch);
    updatedTransaction = buildTransaction(
      transactionId,
      ownerId,
      dto,
      now,
      revision,
    );

    if (mutation) {
      writeAppliedMutation(firestoreTransaction, {
        ownerId,
        context: mutation,
        entityType: "transaction",
        entityId: transactionId,
        revisionAfter: revision,
        now,
      });
    }
  });

  if (!updatedTransaction) {
    throw new TransactionOperationError("TRANSACTION_NOT_FOUND");
  }

  // A replay already has the server state and the wallets it moved.
  if (replayed) return { transaction: updatedTransaction, wallets: replayedWallets };

  return { transaction: updatedTransaction, wallets: updatedWallets };
}
