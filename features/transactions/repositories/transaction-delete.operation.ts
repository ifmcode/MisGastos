import { doc, runTransaction } from "firebase/firestore";

import { db } from "@/lib/firebase";
import { Wallet } from "@/features/wallets/types/wallet.types";
import { roundMoney } from "@/features/wallets/utils/money";

import { TransactionOperationError } from "../services/transaction.errors";
import {
  getSignedTransactionAmount,
  toWalletBalance,
} from "./transaction-firestore.utils";
import { TransactionMutationResult } from "./transaction.repository";

/** Deletes a transaction and reverts its signed amount from the wallet. */
export async function deleteTransactionOperation(
  ownerId: string,
  transactionId: string,
): Promise<TransactionMutationResult> {
  const now = new Date().toISOString();
  const transactionRef = doc(db, "transactions", transactionId);
  const wallets: Wallet[] = [];

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
      currentBalance - getSignedTransactionAmount(type, amount),
    );

    firestoreTransaction.update(walletRef, {
      balance: nextBalance,
      updatedAt: now,
    });
    firestoreTransaction.delete(transactionRef);
  });

  return {
    transaction: {
      id: transactionId,
      type: "expense",
      amount: 0,
      currency: "EUR",
      walletId: "",
      categoryId: "unknown",
      concept: "",
      date: "",
      ownerId,
      createdAt: now,
      updatedAt: now,
    },
    wallets,
  };
}
