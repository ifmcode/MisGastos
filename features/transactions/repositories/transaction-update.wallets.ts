import { doc, type Transaction as FirestoreTransaction } from "firebase/firestore";

import { db } from "@/lib/firebase";
import type { CurrencyCode } from "@/shared/constants/currencies";
import { nextRevision } from "@/shared/utils/revision";
import { isOrphanedWalletId } from "@/features/wallets/utils/deleted-wallet";
import { roundMoney } from "@/features/wallets/utils/money";

import { TransactionOperationError } from "../services/transaction.errors";
import type { TransactionType } from "../types/transaction.types";
import {
  applyTransactionUpdateToBalance,
  getSignedTransactionAmount,
} from "../utils/transaction-balance";
import { toWalletBalance } from "./transaction-firestore.utils";

/** Stored effect of the movement being replaced. */
export interface TransactionWalletMovement {
  type: TransactionType;
  amount: number;
  walletId: string;
}

/** Effect the edited movement will have after the update. */
export interface TransactionWalletTarget {
  type: TransactionType;
  amount: number;
  walletId: string;
  currency: CurrencyCode;
}

/**
 * Reverts the stored movement from its wallet and applies the new one, once per
 * wallet, inside the caller's transaction. An orphaned movement has no wallet
 * to adjust, and moving between wallets touches both documents.
 */
export async function applyTransactionWalletAdjustment(
  transaction: FirestoreTransaction,
  ownerId: string,
  now: string,
  previous: TransactionWalletMovement,
  next: TransactionWalletTarget,
): Promise<void> {
  const previousIsOrphaned = isOrphanedWalletId(previous.walletId);
  const sameWallet = previous.walletId === next.walletId;

  if (sameWallet && previousIsOrphaned) return;

  const newWalletRef = doc(db, "wallets", next.walletId);
  const walletSnapshot = await transaction.get(newWalletRef);
  if (!walletSnapshot.exists()) {
    throw new TransactionOperationError("WALLET_NOT_FOUND");
  }

  const walletData = walletSnapshot.data() as Record<string, unknown>;
  if (walletData.ownerId !== ownerId) {
    throw new TransactionOperationError("WALLET_NOT_OWNED");
  }
  if (walletData.currency !== next.currency) {
    throw new TransactionOperationError("CURRENCY_MISMATCH");
  }

  if (sameWallet) {
    const nextBalance = applyTransactionUpdateToBalance(
      toWalletBalance(walletData),
      { type: previous.type, amount: previous.amount },
      { type: next.type, amount: next.amount },
    );

    transaction.update(newWalletRef, {
      balance: nextBalance,
      updatedAt: now,
      revision: nextRevision(walletData),
    });
    return;
  }

  if (!previousIsOrphaned) {
    const previousWalletRef = doc(db, "wallets", previous.walletId);
    const previousWalletSnapshot = await transaction.get(previousWalletRef);
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
        getSignedTransactionAmount({
          type: previous.type,
          amount: previous.amount,
        }),
    );
    transaction.update(previousWalletRef, {
      balance: nextPreviousBalance,
      updatedAt: now,
      revision: nextRevision(previousWalletData),
    });
  }

  const currentNewBalance = toWalletBalance(walletData);
  const nextNewBalance = roundMoney(
    currentNewBalance +
      getSignedTransactionAmount({ type: next.type, amount: next.amount }),
  );
  transaction.update(newWalletRef, {
    balance: nextNewBalance,
    updatedAt: now,
    revision: nextRevision(walletData),
  });
}
