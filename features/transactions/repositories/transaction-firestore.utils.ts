import { DocumentReference, getDoc } from "firebase/firestore";

import { mapWalletDocument } from "@/features/wallets/repositories/wallet.mapper";
import { Wallet } from "@/features/wallets/types/wallet.types";
import { roundMoney } from "@/shared/utils/money";
import { INITIAL_REVISION } from "@/shared/utils/revision";

import { CreateTransactionDto, Transaction } from "../types/transaction.types";
import {
  readGroupExpenseId,
  readGroupSettlementId,
  readSettlementId,
  readSharedExpenseId,
} from "./transaction-link-readers";

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
  revision: number = INITIAL_REVISION,
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
    revision,
    createdAt: now,
    updatedAt: now,
    deletedAt: dto.deletedAt ?? null,
  };

  const notes = dto.notes?.trim();
  if (notes) {
    data.notes = notes;
  }

  const sharedExpenseId = readSharedExpenseId(dto);
  if (sharedExpenseId) data.sharedExpenseId = sharedExpenseId;

  const groupExpenseId = readGroupExpenseId(dto);
  if (groupExpenseId) data.groupExpenseId = groupExpenseId;

  const settlementId = readSettlementId(dto);
  if (settlementId) data.settlementId = settlementId;

  const groupSettlementId = readGroupSettlementId(dto);
  if (groupSettlementId) data.groupSettlementId = groupSettlementId;

  return data;
}

export function buildTransaction(
  id: string,
  ownerId: string,
  dto: CreateTransactionDto,
  now: string,
  revision: number = INITIAL_REVISION,
): Transaction {
  const sharedExpenseId = readSharedExpenseId(dto);
  const groupExpenseId = readGroupExpenseId(dto);
  const settlementId = readSettlementId(dto);
  const groupSettlementId = readGroupSettlementId(dto);

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
    revision,
    ...(sharedExpenseId ? { sharedExpenseId } : {}),
    ...(groupExpenseId ? { groupExpenseId } : {}),
    ...(settlementId ? { settlementId } : {}),
    ...(groupSettlementId ? { groupSettlementId } : {}),
    createdAt: now,
    updatedAt: now,
    deletedAt: dto.deletedAt ?? null,
  };
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
