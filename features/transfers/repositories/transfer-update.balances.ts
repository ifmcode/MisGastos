import { doc, type Transaction as FirestoreTransaction } from "firebase/firestore";

import { db } from "@/lib/firebase";
import { nextRevision } from "@/shared/utils/revision";
import { mapWalletDocument } from "@/features/wallets/repositories/wallet.mapper";
import { Wallet } from "@/features/wallets/types/wallet.types";
import { isOrphanedWalletId } from "@/features/wallets/utils/deleted-wallet";
import { roundMoney } from "@/features/wallets/utils/money";

import { TransferOperationError } from "../services/transfer.errors";
import { toWalletBalance } from "./transfer-firestore.utils";

export interface TransferBalanceUpdateOptions {
  transaction: FirestoreTransaction;
  ownerId: string;
  now: string;
  /** Every wallet the edit may touch, in a stable order. */
  walletIds: string[];
  walletDataById: Map<string, Record<string, unknown>>;
  adjustments: Map<string, number>;
  fromWalletId: string;
}

/**
 * Applies the net adjustment of an edit to every touched wallet, bumping each
 * revision, and returns the mapped entities. A source wallet cannot end
 * negative; an orphaned source side has no balance to check.
 */
export function applyTransferBalanceUpdates({
  transaction,
  ownerId,
  now,
  walletIds,
  walletDataById,
  adjustments,
  fromWalletId,
}: TransferBalanceUpdateOptions): Wallet[] {
  const finalBalances = new Map<string, number>();

  for (const [walletId, walletData] of walletDataById) {
    finalBalances.set(
      walletId,
      roundMoney(
        toWalletBalance(walletData) + (adjustments.get(walletId) ?? 0),
      ),
    );
  }

  if (
    !isOrphanedWalletId(fromWalletId) &&
    (finalBalances.get(fromWalletId) ?? 0) < 0
  ) {
    throw new TransferOperationError("INSUFFICIENT_FUNDS");
  }

  const updatedWallets: Wallet[] = [];

  for (const walletId of walletIds) {
    const adjustment = adjustments.get(walletId) ?? 0;
    if (adjustment === 0) continue;

    const walletData = walletDataById.get(walletId);
    if (!walletData) continue;

    const balance = finalBalances.get(walletId) ?? 0;
    const revision = nextRevision(walletData);
    const wallet = mapWalletDocument(
      walletId,
      { ...walletData, balance, updatedAt: now, revision },
      ownerId,
    );

    if (wallet) updatedWallets.push(wallet);
    transaction.update(doc(db, "wallets", walletId), {
      balance,
      updatedAt: now,
      revision,
    });
  }

  return updatedWallets;
}
