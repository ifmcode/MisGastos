import { doc, type Transaction as FirestoreTransaction } from "firebase/firestore";

import { db } from "@/lib/firebase";
import { mapWalletDocument } from "@/features/wallets/repositories/wallet.mapper";
import type { Wallet } from "@/features/wallets/types/wallet.types";
import { roundMoney } from "@/shared/utils/money";
import { nextRevision } from "@/shared/utils/revision";
import { getSignedTransactionAmount } from "@/shared/utils/transaction-balance";

import { TransactionOperationError } from "../services/transaction.errors";
import { toWalletBalance } from "./transaction-firestore.utils";

export type RevertTransactionWalletInput = {
  firestoreTransaction: FirestoreTransaction;
  ownerId: string;
  now: string;
  walletId: string;
  currency: string | null;
  type: "expense" | "income";
  amount: number;
};

/**
 * Reverts the movement's signed amount from its wallet inside the running
 * transaction and returns the updated wallet, or null for an orphaned id that
 * has no document left to adjust.
 */
export async function revertTransactionWallet({
  firestoreTransaction,
  ownerId,
  now,
  walletId,
  currency,
  type,
  amount,
}: RevertTransactionWalletInput): Promise<Wallet | null> {
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
  const revision = nextRevision(walletData);

  firestoreTransaction.update(walletRef, {
    balance: nextBalance,
    updatedAt: now,
    revision,
  });

  return mapWalletDocument(
    walletId,
    { ...walletData, balance: nextBalance, updatedAt: now, revision },
    ownerId,
  );
}
