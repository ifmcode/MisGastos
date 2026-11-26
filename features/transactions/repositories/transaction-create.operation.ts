import { collection, doc, runTransaction } from "firebase/firestore";

import { db } from "@/lib/firebase";
import { readClientDocumentId } from "@/shared/utils/client-id";
import { INITIAL_REVISION, nextRevision } from "@/shared/utils/revision";
import { Wallet } from "@/features/wallets/types/wallet.types";
import { roundMoney } from "@/shared/utils/money";
import {
  writeAppliedMutation,
  type SyncMutationContext,
} from "@/shared/services/sync/firestore-idempotency";

import { TransactionOperationError } from "../services/transaction.errors";
import {
  CreateTransactionDto,
  Transaction,
} from "../types/transaction.types";
import { getSignedTransactionAmount } from "@/shared/utils/transaction-balance";
import { readTransactionReplay } from "./transaction-mutation.replay";
import {
  buildTransaction,
  getMappedWallet,
  toTransactionData,
  toWalletBalance,
} from "./transaction-firestore.utils";
import { TransactionMutationResult } from "./transaction.repository";

/**
 * Creates a transaction and applies its signed amount to the wallet balance.
 * With a `mutation` context the operation is replay-safe and writes the
 * idempotency marker atomically; the online path passes no context.
 */
export async function createTransactionOperation(
  ownerId: string,
  dto: CreateTransactionDto,
  mutation?: SyncMutationContext,
): Promise<TransactionMutationResult> {
  const now = new Date().toISOString();
  const walletRef = doc(db, "wallets", dto.walletId);
  const providedId = readClientDocumentId(dto.id);
  const transactionRef = providedId
    ? doc(db, "transactions", providedId)
    : doc(collection(db, "transactions"));

  let replayed = false;
  let replayedTransaction: Transaction | null = null;
  let replayedWallets: Wallet[] = [];

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
        replayedTransaction = replay.transaction;
        replayedWallets = replay.wallets;
        return;
      }
    }

    const walletSnapshot = await firestoreTransaction.get(walletRef);
    if (!walletSnapshot.exists()) {
      throw new TransactionOperationError("WALLET_NOT_FOUND");
    }

    const walletData = walletSnapshot.data() as Record<string, unknown>;
    if (walletData.ownerId !== ownerId) {
      throw new TransactionOperationError("WALLET_NOT_OWNED");
    }
    if (walletData.currency !== dto.currency) {
      throw new TransactionOperationError("CURRENCY_MISMATCH");
    }

    const currentBalance = toWalletBalance(walletData);
    const nextBalance = roundMoney(
      currentBalance +
        getSignedTransactionAmount({ type: dto.type, amount: dto.amount }),
    );

    firestoreTransaction.set(
      transactionRef,
      toTransactionData(ownerId, dto, now, INITIAL_REVISION),
    );
    firestoreTransaction.update(walletRef, {
      balance: nextBalance,
      updatedAt: now,
      revision: nextRevision(walletData),
    });

    if (mutation) {
      writeAppliedMutation(firestoreTransaction, {
        ownerId,
        context: mutation,
        entityType: "transaction",
        entityId: transactionRef.id,
        revisionAfter: INITIAL_REVISION,
        now,
      });
    }
  });

  if (replayed) {
    if (!replayedTransaction) {
      throw new TransactionOperationError("TRANSACTION_INVALID");
    }

    return { transaction: replayedTransaction, wallets: replayedWallets };
  }

  const updatedWallet = await getMappedWallet(walletRef, ownerId);
  const wallets: Wallet[] = updatedWallet ? [updatedWallet] : [];

  return {
    transaction: buildTransaction(
      transactionRef.id,
      ownerId,
      dto,
      now,
      INITIAL_REVISION,
    ),
    wallets,
  };
}
