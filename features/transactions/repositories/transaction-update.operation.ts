import { doc, runTransaction } from "firebase/firestore";

import { db } from "@/lib/firebase";
import { Wallet } from "@/features/wallets/types/wallet.types";
import { roundMoney } from "@/features/wallets/utils/money";

import { TransactionOperationError } from "../services/transaction.errors";
import { UpdateTransactionDto } from "../types/transaction.types";
import { toIsoTimestamp } from "../utils/transaction-date";
import {
  buildTransaction,
  getMappedWallet,
  getSignedTransactionAmount,
  toTransactionData,
  toWalletBalance,
} from "./transaction-firestore.utils";
import { TransactionMutationResult } from "./transaction.repository";

export interface UpdateTransactionOperationOptions {
  ownerId: string;
  transactionId: string;
  dto: UpdateTransactionDto;
}

/**
 * Updates a transaction, reverting the stored movement from its original
 * wallet before applying the new one.
 */
export async function updateTransactionOperation({
  ownerId,
  transactionId,
  dto,
}: UpdateTransactionOperationOptions): Promise<TransactionMutationResult> {
  const now = new Date().toISOString();
  const transactionRef = doc(db, "transactions", transactionId);
  const newWalletRef = doc(db, "wallets", dto.walletId);

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

    const previousType = transactionData.type;
    const previousAmount =
      typeof transactionData.amount === "number"
        ? roundMoney(transactionData.amount)
        : null;
    const previousWalletId =
      typeof transactionData.walletId === "string"
        ? transactionData.walletId
        : "";

    if (previousType !== "expense" && previousType !== "income") {
      throw new TransactionOperationError("TRANSACTION_INVALID");
    }
    if (previousAmount === null || previousAmount <= 0) {
      throw new TransactionOperationError("TRANSACTION_INVALID");
    }
    if (previousWalletId.length === 0) {
      throw new TransactionOperationError("TRANSACTION_INVALID");
    }

    const walletSnapshot = await firestoreTransaction.get(newWalletRef);
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

    if (previousWalletId === dto.walletId) {
      const currentBalance = toWalletBalance(walletData);
      const revertedBalance = roundMoney(
        currentBalance -
          getSignedTransactionAmount(previousType, previousAmount),
      );
      const nextBalance = roundMoney(
        revertedBalance + getSignedTransactionAmount(dto),
      );

      firestoreTransaction.update(newWalletRef, {
        balance: nextBalance,
        updatedAt: now,
      });
    } else {
      const previousWalletRef = doc(db, "wallets", previousWalletId);
      const previousWalletSnapshot =
        await firestoreTransaction.get(previousWalletRef);
      if (!previousWalletSnapshot.exists()) {
        throw new TransactionOperationError("WALLET_NOT_FOUND");
      }
      const previousWalletData =
        previousWalletSnapshot.data() as Record<string, unknown>;
      if (previousWalletData.ownerId !== ownerId) {
        throw new TransactionOperationError("WALLET_NOT_OWNED");
      }

      const currentPreviousBalance = toWalletBalance(previousWalletData);
      const nextPreviousBalance = roundMoney(
        currentPreviousBalance -
          getSignedTransactionAmount(previousType, previousAmount),
      );
      firestoreTransaction.update(previousWalletRef, {
        balance: nextPreviousBalance,
        updatedAt: now,
      });

      const currentNewBalance = toWalletBalance(walletData);
      const nextNewBalance = roundMoney(
        currentNewBalance + getSignedTransactionAmount(dto),
      );
      firestoreTransaction.update(newWalletRef, {
        balance: nextNewBalance,
        updatedAt: now,
      });
    }

    firestoreTransaction.update(transactionRef, {
      ...toTransactionData(ownerId, dto, now),
      createdAt: toIsoTimestamp(transactionData.createdAt) ?? now,
    });
  });

  const updatedWallet = await getMappedWallet(newWalletRef, ownerId);
  const wallets: Wallet[] = updatedWallet ? [updatedWallet] : [];

  return {
    transaction: buildTransaction(transactionId, ownerId, dto, now),
    wallets,
  };
}
