import { doc, runTransaction } from "firebase/firestore";

import { db } from "@/lib/firebase";
import { readStoredRevision } from "@/shared/utils/revision";
import { Wallet } from "@/features/wallets/types/wallet.types";
import { isOrphanedWalletId } from "@/features/wallets/utils/deleted-wallet";
import {
  assertExpectedRevision,
  writeAppliedMutation,
  type SyncMutationContext,
} from "@/shared/services/sync/firestore-idempotency";

import { TransactionOperationError } from "../services/transaction.errors";
import { Transaction } from "../types/transaction.types";
import { readTransactionReplay } from "./transaction-mutation.replay";
import { readDeletableMovement } from "./transaction-delete.previous";
import { buildDeletedTransactionResult } from "./transaction-delete.result";
import { revertTransactionWallet } from "./transaction-delete.wallet";
import {
  hasStoredMovementLink,
  readStoredDeletedAt,
} from "./transaction-stored.utils";
import { TransactionMutationResult } from "./transaction.repository";

/**
 * Soft-deletes a personal transaction and reverts its signed amount from the
 * wallet exactly once: an already deleted movement returns without touching the
 * balance again. Linked movements are rejected because their owning feature
 * operation owns the revert.
 */
export async function deleteTransactionOperation(
  ownerId: string,
  transactionId: string,
  mutation?: SyncMutationContext,
): Promise<TransactionMutationResult> {
  const now = new Date().toISOString();
  const transactionRef = doc(db, "transactions", transactionId);
  const wallets: Wallet[] = [];
  let deleted: Transaction | null = null;
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
        deleted = replay.transaction;
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

    const storedRevision = readStoredRevision(transactionData);
    const storedDeletedAt = readStoredDeletedAt(transactionData);

    // Idempotent: the first delete already reverted the balance. Another device
    // deleting it first leaves the server in the state the user wants, so the
    // queued delete also succeeds instead of opening a conflict.
    if (storedDeletedAt !== null) {
      deleted = buildDeletedTransactionResult(
        transactionId,
        ownerId,
        transactionData,
        now,
        storedRevision,
        storedDeletedAt,
      );
      return;
    }

    if (mutation) assertExpectedRevision(transactionData, mutation);

    if (hasStoredMovementLink(transactionData)) {
      throw new TransactionOperationError("TRANSACTION_INVALID");
    }

    const revision = storedRevision + 1;
    const { type, amount, walletId, currency } =
      readDeletableMovement(transactionData);

    const patch: Record<string, unknown> = {
      deletedAt: now,
      updatedAt: now,
      revision,
    };

    // Movements orphaned by a permanent wallet deletion have no wallet document
    // to adjust; deleting them only stamps the history entry.
    if (!isOrphanedWalletId(walletId)) {
      const updatedWallet = await revertTransactionWallet({
        firestoreTransaction,
        ownerId,
        now,
        walletId,
        currency,
        type,
        amount,
      });
      if (updatedWallet) wallets.push(updatedWallet);
    }

    firestoreTransaction.update(transactionRef, patch);
    deleted = buildDeletedTransactionResult(
      transactionId,
      ownerId,
      transactionData,
      now,
      revision,
      now,
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

  if (!deleted) throw new TransactionOperationError("TRANSACTION_NOT_FOUND");

  if (replayed) return { transaction: deleted, wallets: replayedWallets };

  return { transaction: deleted, wallets };
}
