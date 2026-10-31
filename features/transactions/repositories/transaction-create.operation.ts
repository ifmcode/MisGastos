import { collection, doc, runTransaction } from "firebase/firestore";

import { db } from "@/lib/firebase";
import { Wallet } from "@/features/wallets/types/wallet.types";
import { roundMoney } from "@/features/wallets/utils/money";

import { TransactionOperationError } from "../services/transaction.errors";
import {
  CreateTransactionDto,
  Transaction,
} from "../types/transaction.types";
import {
  buildTransaction,
  getMappedWallet,
  getSignedTransactionAmountObj,
  toTransactionData,
  toWalletBalance,
} from "./transaction-firestore.utils";
import { TransactionMutationResult } from "./transaction.repository";

/** Creates a transaction and applies its signed amount to the wallet balance. */
export async function createTransactionOperation(
  ownerId: string,
  dto: CreateTransactionDto,
): Promise<TransactionMutationResult> {
  const now = new Date().toISOString();
  const transactionsRef = collection(db, "transactions");
  const walletRef = doc(db, "wallets", dto.walletId);

  let createdId = "";

  await runTransaction(db, async (firestoreTransaction) => {
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
      currentBalance + getSignedTransactionAmountObj(dto),
    );

    const transactionRef = doc(transactionsRef);
    createdId = transactionRef.id;

    firestoreTransaction.set(
      transactionRef,
      toTransactionData(ownerId, dto, now),
    );
    firestoreTransaction.update(walletRef, {
      balance: nextBalance,
      updatedAt: now,
    });
  });

  const updatedWallet = await getMappedWallet(walletRef, ownerId);
  const wallets: Wallet[] = updatedWallet ? [updatedWallet] : [];

  return {
    transaction: buildTransaction(createdId, ownerId, dto, now),
    wallets,
  };
}
