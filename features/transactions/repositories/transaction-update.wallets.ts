import { doc, type Transaction as FirestoreTransaction } from "firebase/firestore";

import { db } from "@/lib/firebase";
import { mapWalletDocument } from "@/features/wallets/repositories/wallet.mapper";
import type { CurrencyCode } from "@/shared/constants/currencies";
import type { Wallet } from "@/features/wallets/types/wallet.types";
import { nextRevision } from "@/shared/utils/revision";
import { isOrphanedWalletId } from "@/features/wallets/utils/deleted-wallet";
import { roundMoney } from "@/shared/utils/money";

import { TransactionOperationError } from "../services/transaction.errors";
import type { TransactionType } from "../types/transaction.types";
import {
  applyTransactionUpdateToBalance,
  getSignedTransactionAmount,
} from "@/shared/utils/transaction-balance";
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

function toMappedWallet(
  walletId: string,
  data: Record<string, unknown>,
  balance: number,
  revision: number,
  updatedAt: string,
  ownerId: string,
): Wallet[] {
  const wallet = mapWalletDocument(
    walletId,
    { ...data, balance, updatedAt, revision },
    ownerId,
  );

  return wallet ? [wallet] : [];
}

/**
 * Reverts the stored movement from its wallet and applies the new one, once per
 * wallet, inside the caller's transaction. An orphaned movement has no wallet
 * to adjust, and moving between wallets touches both documents, so both updated
 * wallets are returned for the caller to refresh its state.
 */
export async function applyTransactionWalletAdjustment(
  transaction: FirestoreTransaction,
  ownerId: string,
  now: string,
  previous: TransactionWalletMovement,
  next: TransactionWalletTarget,
): Promise<Wallet[]> {
  const previousIsOrphaned = isOrphanedWalletId(previous.walletId);
  const sameWallet = previous.walletId === next.walletId;

  const newWalletRef = doc(db, "wallets", next.walletId);

  if (sameWallet && previousIsOrphaned) return [];

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
    const revision = nextRevision(walletData);

    transaction.update(newWalletRef, {
      balance: nextBalance,
      updatedAt: now,
      revision,
    });

    return toMappedWallet(
      next.walletId,
      walletData,
      nextBalance,
      revision,
      now,
      ownerId,
    );
  }

  const wallets: Wallet[] = [];

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
    const previousRevision = nextRevision(previousWalletData);
    transaction.update(previousWalletRef, {
      balance: nextPreviousBalance,
      updatedAt: now,
      revision: previousRevision,
    });

    wallets.push(
      ...toMappedWallet(
        previous.walletId,
        previousWalletData,
        nextPreviousBalance,
        previousRevision,
        now,
        ownerId,
      ),
    );
  }

  const currentNewBalance = toWalletBalance(walletData);
  const nextNewBalance = roundMoney(
    currentNewBalance +
      getSignedTransactionAmount({ type: next.type, amount: next.amount }),
  );
  const newRevision = nextRevision(walletData);
  transaction.update(newWalletRef, {
    balance: nextNewBalance,
    updatedAt: now,
    revision: newRevision,
  });

  wallets.push(
    ...toMappedWallet(
      next.walletId,
      walletData,
      nextNewBalance,
      newRevision,
      now,
      ownerId,
    ),
  );

  return wallets;
}
