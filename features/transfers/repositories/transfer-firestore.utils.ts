import { doc, Transaction } from "firebase/firestore";

import { db } from "@/lib/firebase";
import { roundMoney } from "@/features/wallets/utils/money";

import { TransferOperationError } from "../services/transfer.errors";
import { CreateTransferDto, Transfer } from "../types/transfer.types";

export function toWalletBalance(data: Record<string, unknown>): number {
  const balance = data.balance;
  if (typeof balance === "number" && Number.isFinite(balance)) {
    return roundMoney(balance);
  }

  const initialBalance = data.initialBalance;
  if (typeof initialBalance === "number" && Number.isFinite(initialBalance)) {
    return roundMoney(initialBalance);
  }

  return 0;
}

export function toTransferData(
  ownerId: string,
  dto: CreateTransferDto,
  now: string,
): Record<string, unknown> {
  const data: Record<string, unknown> = {
    fromWalletId: dto.fromWalletId,
    toWalletId: dto.toWalletId,
    amount: roundMoney(dto.amount),
    currency: dto.currency,
    date: dto.date,
    ownerId,
    createdAt: now,
    updatedAt: now,
  };

  const notes = dto.notes?.trim();
  if (notes) {
    data.notes = notes;
  }

  return data;
}

export function buildTransfer(
  id: string,
  ownerId: string,
  dto: CreateTransferDto,
  createdAt: string,
  updatedAt: string,
): Transfer {
  return {
    id,
    fromWalletId: dto.fromWalletId,
    toWalletId: dto.toWalletId,
    amount: roundMoney(dto.amount),
    currency: dto.currency,
    date: dto.date,
    ...(dto.notes?.trim() ? { notes: dto.notes.trim() } : {}),
    ownerId,
    createdAt,
    updatedAt,
  };
}

export function addBalanceAdjustment(
  adjustments: Map<string, number>,
  walletId: string,
  amount: number,
): void {
  adjustments.set(
    walletId,
    roundMoney((adjustments.get(walletId) ?? 0) + amount),
  );
}

export interface LoadTransferWalletsOptions {
  transaction: Transaction;
  ownerId: string;
  walletIds: string[];
  fromWalletId: string;
  toWalletId: string;
  previousFromWalletId: string;
}

/** Reads the wallets touched by a transfer update and validates ownership. */
export async function loadTransferWallets({
  transaction,
  ownerId,
  walletIds,
  fromWalletId,
  toWalletId,
  previousFromWalletId,
}: LoadTransferWalletsOptions): Promise<
  Map<string, Record<string, unknown>>
> {
  const walletDataById = new Map<string, Record<string, unknown>>();

  for (const walletId of walletIds) {
    const walletSnapshot = await transaction.get(doc(db, "wallets", walletId));

    if (!walletSnapshot.exists()) {
      if (walletId === fromWalletId) {
        throw new TransferOperationError("FROM_WALLET_NOT_FOUND");
      }
      if (walletId === toWalletId) {
        throw new TransferOperationError("TO_WALLET_NOT_FOUND");
      }
      throw new TransferOperationError(
        walletId === previousFromWalletId
          ? "FROM_WALLET_NOT_FOUND"
          : "TO_WALLET_NOT_FOUND",
      );
    }

    const walletData = walletSnapshot.data() as Record<string, unknown>;
    if (walletData.ownerId !== ownerId) {
      throw new TransferOperationError("WALLET_NOT_OWNED");
    }

    walletDataById.set(walletId, walletData);
  }

  return walletDataById;
}
