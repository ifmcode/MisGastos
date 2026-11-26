import { doc, type Transaction as FirestoreTransaction } from "firebase/firestore";

import { db } from "@/lib/firebase";
import { mapWalletDocument } from "@/features/wallets/repositories/wallet.mapper";
import type { Wallet } from "@/features/wallets/types/wallet.types";
import { isOrphanedWalletId } from "@/features/wallets/utils/deleted-wallet";
import { roundMoney } from "@/shared/utils/money";
import { nextRevision } from "@/shared/utils/revision";

import { TransferOperationError } from "../services/transfer.errors";
import type { Transfer } from "../types/transfer.types";
import { toWalletBalance } from "./transfer-firestore.utils";

export type RevertTransferWalletsInput = {
  firestoreTransaction: FirestoreTransaction;
  ownerId: string;
  now: string;
  previous: Transfer;
};

async function revertWallet(
  input: RevertTransferWalletsInput,
  walletId: string,
  delta: number,
  missingCode: "FROM_WALLET_NOT_FOUND" | "TO_WALLET_NOT_FOUND",
): Promise<Wallet | null> {
  const { firestoreTransaction, ownerId, now } = input;
  const walletRef = doc(db, "wallets", walletId);
  const snapshot = await firestoreTransaction.get(walletRef);
  if (!snapshot.exists()) {
    throw new TransferOperationError(missingCode);
  }

  const data = snapshot.data() as Record<string, unknown>;
  if (data.ownerId !== ownerId) {
    throw new TransferOperationError("WALLET_NOT_OWNED");
  }

  const balance = roundMoney(toWalletBalance(data) + delta);
  const revision = nextRevision(data);

  firestoreTransaction.update(walletRef, {
    balance,
    updatedAt: now,
    revision,
  });

  return mapWalletDocument(
    walletId,
    { ...data, balance, updatedAt: now, revision },
    ownerId,
  );
}

/** Reverts both sides of a deleted transfer; orphaned ids have no document. */
export async function revertTransferWallets({
  previous,
  ...input
}: RevertTransferWalletsInput): Promise<Wallet[]> {
  const wallets: Wallet[] = [];

  if (!isOrphanedWalletId(previous.fromWalletId)) {
    const from = await revertWallet(
      { previous, ...input },
      previous.fromWalletId,
      previous.amount,
      "FROM_WALLET_NOT_FOUND",
    );
    if (from) wallets.push(from);
  }

  if (!isOrphanedWalletId(previous.toWalletId)) {
    const to = await revertWallet(
      { previous, ...input },
      previous.toWalletId,
      -previous.amount,
      "TO_WALLET_NOT_FOUND",
    );
    if (to) wallets.push(to);
  }

  return wallets;
}
