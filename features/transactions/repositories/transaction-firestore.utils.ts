import { DocumentReference, getDoc } from "firebase/firestore";

import { mapWalletDocument } from "@/features/wallets/repositories/wallet.mapper";
import { Wallet } from "@/features/wallets/types/wallet.types";
import { roundMoney } from "@/features/wallets/utils/money";

import {
  CreateTransactionDto,
  Transaction,
  TransactionType,
} from "../types/transaction.types";

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

export function toTransactionData(
  ownerId: string,
  dto: CreateTransactionDto,
  now: string,
): Record<string, unknown> {
  const data: Record<string, unknown> = {
    type: dto.type,
    amount: roundMoney(dto.amount),
    currency: dto.currency,
    walletId: dto.walletId,
    categoryId: dto.categoryId,
    concept: dto.concept.trim(),
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

export function buildTransaction(
  id: string,
  ownerId: string,
  dto: CreateTransactionDto,
  now: string,
): Transaction {
  return {
    id,
    type: dto.type,
    amount: roundMoney(dto.amount),
    currency: dto.currency,
    walletId: dto.walletId,
    categoryId: dto.categoryId,
    concept: dto.concept.trim(),
    ...(dto.notes?.trim() ? { notes: dto.notes.trim() } : {}),
    date: dto.date,
    ownerId,
    createdAt: now,
    updatedAt: now,
  };
}

export function getSignedTransactionAmount(
  type: TransactionType | CreateTransactionDto,
  amount?: number,
): number {
  if (typeof type === "object") {
    return getSignedTransactionAmountObj(type);
  }

  return getSignedTransactionAmountObj({
    type: type as "expense" | "income",
    amount: amount ?? 0,
  });
}

export function getSignedTransactionAmountObj({
  type,
  amount,
}: {
  type: "expense" | "income";
  amount: number;
}): number {
  return roundMoney(type === "income" ? amount : -amount);
}

/** Reads and maps the wallet after a write so callers can refresh their state. */
export async function getMappedWallet(
  walletRef: DocumentReference,
  ownerId: string,
): Promise<Wallet | null> {
  const snapshot = await getDoc(walletRef);
  if (!snapshot.exists()) return null;

  return mapWalletDocument(
    snapshot.id,
    snapshot.data() as Record<string, unknown>,
    ownerId,
  );
}
