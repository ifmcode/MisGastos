import { doc, runTransaction } from "firebase/firestore";

import { db } from "@/lib/firebase";
import { nextRevision, readStoredRevision } from "@/shared/utils/revision";
import { Wallet } from "@/features/wallets/types/wallet.types";
import { isOrphanedWalletId } from "@/features/wallets/utils/deleted-wallet";
import { roundMoney } from "@/features/wallets/utils/money";

import { TransactionOperationError } from "../services/transaction.errors";
import { Transaction } from "../types/transaction.types";
import { getSignedTransactionAmount } from "../utils/transaction-balance";
import { toWalletBalance } from "./transaction-firestore.utils";
import { buildDeletedTransactionResult } from "./transaction-delete.result";
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
): Promise<TransactionMutationResult> {
  const now = new Date().toISOString();
  const transactionRef = doc(db, "transactions", transactionId);
  const wallets: Wallet[] = [];
  let deleted: Transaction | null = null;

  await runTransaction(db, async (firestoreTransaction) => {
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

    // Idempotent: the first delete already reverted the balance.
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

    if (hasStoredMovementLink(transactionData)) {
      throw new TransactionOperationError("TRANSACTION_INVALID");
    }

    const revision = storedRevision + 1;

    const type = transactionData.type;
    const amount =
      typeof transactionData.amount === "number"
        ? roundMoney(transactionData.amount)
        : null;
    const walletId =
      typeof transactionData.walletId === "string"
        ? transactionData.walletId
        : "";
    const currency =
      typeof transactionData.currency === "string"
        ? transactionData.currency
        : null;

    if (type !== "expense" && type !== "income") {
      throw new TransactionOperationError("TRANSACTION_INVALID");
    }
    if (amount === null || amount <= 0) {
      throw new TransactionOperationError("TRANSACTION_INVALID");
    }
    if (walletId.length === 0) {
      throw new TransactionOperationError("TRANSACTION_INVALID");
    }

    const patch: Record<string, unknown> = {
      deletedAt: now,
      updatedAt: now,
      revision,
    };

    // Movements orphaned by a permanent wallet deletion have no wallet document
    // to adjust; deleting them only stamps the history entry.
    if (!isOrphanedWalletId(walletId)) {
      const walletRef = doc(db, "wallets", walletId);
      const walletSnapshot = await firestoreTransaction.get(walletRef);
      if (!walletSnapshot.exists()) {
        throw new TransactionOperationError("WALLET_NOT_FOUND");
      }

      const walletData = walletSnapshot.data() as Record<string, unknown>;
      if (walletData.ownerId !== ownerId) {
        throw new TransactionOperationError("WALLET_NOT_OWNED");
      }
      if (currency && walletData.currency !== currency) {
        throw new TransactionOperationError("CURRENCY_MISMATCH");
      }

      const currentBalance = toWalletBalance(walletData);
      const nextBalance = roundMoney(
        currentBalance - getSignedTransactionAmount({ type, amount }),
      );

      firestoreTransaction.update(walletRef, {
        balance: nextBalance,
        updatedAt: now,
        revision: nextRevision(walletData),
      });
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
  });

  if (!deleted) throw new TransactionOperationError("TRANSACTION_NOT_FOUND");

  return { transaction: deleted, wallets };
}
