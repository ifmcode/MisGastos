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
    deletedAt: dto.deletedAt ?? null,
  };

  const notes = dto.notes?.trim();
  if (notes) {
    data.notes = notes;
  }

  const sharedExpenseId = readSharedExpenseId(dto);
  if (sharedExpenseId) data.sharedExpenseId = sharedExpenseId;

  const settlementId = readSettlementId(dto);
  if (settlementId) data.settlementId = settlementId;

  return data;
}

/**
 * Linked ids only exist on expenses: income movements never carry one, so the
 * mapper drops the value instead of rejecting the whole record.
 */
function readSharedExpenseId(dto: CreateTransactionDto): string | null {
  if (dto.type !== "expense") return null;

  const id = typeof dto.sharedExpenseId === "string"
    ? dto.sharedExpenseId.trim()
    : "";

  return id.length > 0 ? id : null;
}

/**
 * A settlement income is the mirror case: the link is only valid on an income,
 * because a settlement records money the creditor received.
 */
export function readSettlementId(dto: CreateTransactionDto): string | null {
  if (dto.type !== "income") return null;

  const id = typeof dto.settlementId === "string" ? dto.settlementId.trim() : "";

  return id.length > 0 ? id : null;
}

export function buildTransaction(
  id: string,
  ownerId: string,
  dto: CreateTransactionDto,
  now: string,
): Transaction {
  const sharedExpenseId = readSharedExpenseId(dto);
  const settlementId = readSettlementId(dto);

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
    ...(sharedExpenseId ? { sharedExpenseId } : {}),
    ...(settlementId ? { settlementId } : {}),
    createdAt: now,
    updatedAt: now,
    deletedAt: dto.deletedAt ?? null,
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

/**
 * Soft-delete stamp of a stored movement. A non-empty value keeps the record
 * out of the movements list, so it is never normalized away.
 */
export function readStoredDeletedAt(
  data: Record<string, unknown>,
): string | null {
  return typeof data.deletedAt === "string" && data.deletedAt.trim().length > 0
    ? data.deletedAt.trim()
    : null;
}

/** Stored `sharedExpenseId`, if any; personal movements never have one. */
export function readStoredSharedExpenseId(
  data: Record<string, unknown>,
): string | undefined {
  const id =
    typeof data.sharedExpenseId === "string" ? data.sharedExpenseId.trim() : "";

  return id.length > 0 ? id : undefined;
}

/** Reads and maps the wallet after a write so callers can refresh their state. */export async function getMappedWallet(
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
