import { type Transaction as FirestoreTransaction } from "firebase/firestore";

import type { Wallet } from "@/features/wallets/types/wallet.types";

import { TransferOperationError } from "../services/transfer.errors";
import type { Transfer, UpdateTransferDto } from "../types/transfer.types";
import {
  addBalanceAdjustment,
  loadTransferWallets,
} from "./transfer-firestore.utils";
import { applyTransferBalanceUpdates } from "./transfer-update.balances";

export type ApplyTransferUpdateInput = {
  firestoreTransaction: FirestoreTransaction;
  ownerId: string;
  now: string;
  previous: Transfer;
  dto: UpdateTransferDto;
};

/**
 * Reverts the previous transfer and applies the new one on every affected
 * wallet, inside the running transaction. Returns the updated wallets.
 */
export async function applyTransferUpdate({
  firestoreTransaction,
  ownerId,
  now,
  previous,
  dto,
}: ApplyTransferUpdateInput): Promise<Wallet[]> {
  const walletIds = Array.from(
    new Set([
      previous.fromWalletId,
      previous.toWalletId,
      dto.fromWalletId,
      dto.toWalletId,
    ]),
  );

  const walletDataById = await loadTransferWallets({
    transaction: firestoreTransaction,
    ownerId,
    walletIds,
    fromWalletId: dto.fromWalletId,
    toWalletId: dto.toWalletId,
    previousFromWalletId: previous.fromWalletId,
  });

  const nextFromWallet = walletDataById.get(dto.fromWalletId) ?? {};
  const nextToWallet = walletDataById.get(dto.toWalletId) ?? {};

  if (
    nextFromWallet.currency !== dto.currency ||
    nextToWallet.currency !== dto.currency
  ) {
    throw new TransferOperationError("CURRENCY_MISMATCH");
  }

  const adjustments = new Map<string, number>();
  addBalanceAdjustment(adjustments, previous.fromWalletId, previous.amount);
  addBalanceAdjustment(adjustments, previous.toWalletId, -previous.amount);
  addBalanceAdjustment(adjustments, dto.fromWalletId, -dto.amount);
  addBalanceAdjustment(adjustments, dto.toWalletId, dto.amount);

  return applyTransferBalanceUpdates({
    transaction: firestoreTransaction,
    ownerId,
    now,
    walletIds,
    walletDataById,
    adjustments,
    fromWalletId: dto.fromWalletId,
  });
}
