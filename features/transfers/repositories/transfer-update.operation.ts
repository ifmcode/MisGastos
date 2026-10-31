import { doc, runTransaction } from "firebase/firestore";

import { db } from "@/lib/firebase";
import { mapWalletDocument } from "@/features/wallets/repositories/wallet.mapper";
import { Wallet } from "@/features/wallets/types/wallet.types";
import { roundMoney } from "@/features/wallets/utils/money";
import { toIsoTimestamp } from "@/features/transactions/utils/transaction-date";

import { TransferOperationError } from "../services/transfer.errors";
import { Transfer, UpdateTransferDto } from "../types/transfer.types";
import { mapTransferDocument } from "./transfer.mapper";
import {
  addBalanceAdjustment,
  buildTransfer,
  loadTransferWallets,
  toTransferData,
  toWalletBalance,
} from "./transfer-firestore.utils";
import { TransferMutationResult } from "./transfer.repository";

export interface UpdateTransferOperationOptions {
  ownerId: string;
  transferId: string;
  dto: UpdateTransferDto;
}

/** Replaces a transfer, reverting the previous balances before applying it. */
export async function updateTransferOperation({
  ownerId,
  transferId,
  dto,
}: UpdateTransferOperationOptions): Promise<TransferMutationResult> {
  const now = new Date().toISOString();
  const transferRef = doc(db, "transfers", transferId);

  let updatedTransfer: Transfer | null = null;
  let updatedWallets: Wallet[] = [];

  await runTransaction(db, async (firestoreTransaction) => {
    if (dto.fromWalletId === dto.toWalletId) {
      throw new TransferOperationError("SAME_WALLET");
    }
    if (!Number.isFinite(dto.amount) || dto.amount <= 0) {
      throw new TransferOperationError("TRANSFER_INVALID");
    }

    const transferSnapshot = await firestoreTransaction.get(transferRef);
    if (!transferSnapshot.exists()) {
      throw new TransferOperationError("TRANSFER_NOT_FOUND");
    }

    const transferData = transferSnapshot.data() as Record<string, unknown>;
    if (transferData.ownerId !== ownerId) {
      throw new TransferOperationError("TRANSFER_NOT_FOUND");
    }

    const previous = mapTransferDocument(transferId, transferData, ownerId);
    if (!previous) {
      throw new TransferOperationError("TRANSFER_INVALID");
    }
    if (previous.deletedAt) {
      throw new TransferOperationError("TRANSFER_NOT_FOUND");
    }

    const previousCreatedAt = toIsoTimestamp(previous.createdAt) ?? now;

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
    addBalanceAdjustment(
      adjustments,
      previous.toWalletId,
      -previous.amount,
    );
    addBalanceAdjustment(adjustments, dto.fromWalletId, -dto.amount);
    addBalanceAdjustment(adjustments, dto.toWalletId, dto.amount);

    const finalBalances = new Map<string, number>();
    for (const [walletId, walletData] of walletDataById) {
      finalBalances.set(
        walletId,
        roundMoney(
          toWalletBalance(walletData) + (adjustments.get(walletId) ?? 0),
        ),
      );
    }

    if ((finalBalances.get(dto.fromWalletId) ?? 0) < 0) {
      throw new TransferOperationError("INSUFFICIENT_FUNDS");
    }

    updatedWallets = [];

    for (const walletId of walletIds) {
      const adjustment = adjustments.get(walletId) ?? 0;
      if (adjustment === 0) continue;

      const walletData = walletDataById.get(walletId);
      if (!walletData) continue;

      const balance = finalBalances.get(walletId) ?? 0;
      const wallet = mapWalletDocument(
        walletId,
        { ...walletData, balance, updatedAt: now },
        ownerId,
      );

      if (wallet) updatedWallets.push(wallet);
      firestoreTransaction.update(doc(db, "wallets", walletId), {
        balance,
        updatedAt: now,
      });
    }

    firestoreTransaction.update(transferRef, {
      ...toTransferData(ownerId, dto, now),
      createdAt: previousCreatedAt,
    });

    updatedTransfer = buildTransfer(
      transferId,
      ownerId,
      dto,
      previousCreatedAt,
      now,
    );
  });

  if (!updatedTransfer) {
    throw new TransferOperationError("TRANSFER_NOT_FOUND");
  }

  return { transfer: updatedTransfer, wallets: updatedWallets };
}
