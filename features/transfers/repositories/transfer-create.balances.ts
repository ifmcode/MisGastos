import { doc, type Transaction as FirestoreTransaction } from "firebase/firestore";

import { db } from "@/lib/firebase";
import { mapWalletDocument } from "@/features/wallets/repositories/wallet.mapper";
import type { Wallet } from "@/features/wallets/types/wallet.types";
import { nextRevision } from "@/shared/utils/revision";

import { TransferOperationError } from "../services/transfer.errors";
import type { CreateTransferDto } from "../types/transfer.types";
import {
  applyTransferToBalances,
  hasSufficientBalance,
} from "../utils/transfer-balance";
import { toWalletBalance } from "./transfer-firestore.utils";

export type ApplyTransferCreationInput = {
  firestoreTransaction: FirestoreTransaction;
  ownerId: string;
  dto: CreateTransferDto;
  now: string;
};

/**
 * Validates both wallets against the server balances inside the running
 * transaction, moves the amount and returns the updated wallets. Throws the
 * same codes as the online transfer form.
 */
export async function applyTransferCreation({
  firestoreTransaction,
  ownerId,
  dto,
  now,
}: ApplyTransferCreationInput): Promise<Wallet[]> {
  if (dto.fromWalletId === dto.toWalletId) {
    throw new TransferOperationError("SAME_WALLET");
  }
  if (!Number.isFinite(dto.amount) || dto.amount <= 0) {
    throw new TransferOperationError("TRANSFER_INVALID");
  }

  const fromWalletRef = doc(db, "wallets", dto.fromWalletId);
  const toWalletRef = doc(db, "wallets", dto.toWalletId);
  const fromSnapshot = await firestoreTransaction.get(fromWalletRef);
  if (!fromSnapshot.exists()) {
    throw new TransferOperationError("FROM_WALLET_NOT_FOUND");
  }

  const toSnapshot = await firestoreTransaction.get(toWalletRef);
  if (!toSnapshot.exists()) {
    throw new TransferOperationError("TO_WALLET_NOT_FOUND");
  }

  const fromData = fromSnapshot.data() as Record<string, unknown>;
  const toData = toSnapshot.data() as Record<string, unknown>;

  if (fromData.ownerId !== ownerId || toData.ownerId !== ownerId) {
    throw new TransferOperationError("WALLET_NOT_OWNED");
  }
  if (fromData.currency !== dto.currency || toData.currency !== dto.currency) {
    throw new TransferOperationError("CURRENCY_MISMATCH");
  }

  const fromBalance = toWalletBalance(fromData);
  if (!hasSufficientBalance(fromBalance, dto.amount)) {
    throw new TransferOperationError("INSUFFICIENT_FUNDS");
  }

  const next = applyTransferToBalances(
    fromBalance,
    toWalletBalance(toData),
    dto.amount,
  );
  const fromRevision = nextRevision(fromData);
  const toRevision = nextRevision(toData);

  firestoreTransaction.update(fromWalletRef, {
    balance: next.fromBalance,
    updatedAt: now,
    revision: fromRevision,
  });
  firestoreTransaction.update(toWalletRef, {
    balance: next.toBalance,
    updatedAt: now,
    revision: toRevision,
  });

  const wallets: Wallet[] = [];
  const fromWallet = mapWalletDocument(
    dto.fromWalletId,
    { ...fromData, balance: next.fromBalance, updatedAt: now, revision: fromRevision },
    ownerId,
  );
  const toWallet = mapWalletDocument(
    dto.toWalletId,
    { ...toData, balance: next.toBalance, updatedAt: now, revision: toRevision },
    ownerId,
  );

  if (fromWallet) wallets.push(fromWallet);
  if (toWallet) wallets.push(toWallet);

  return wallets;
}
