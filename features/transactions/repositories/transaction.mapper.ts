import { isCurrencyCode } from "@/shared/constants/currencies";

import { roundMoney } from "@/features/wallets/utils/money";

import { Transaction } from "../types/transaction.types";
import {
  toIsoDateValue,
  toIsoTimestamp,
} from "../utils/transaction-date";
import {
  getDefaultCategoryId,
  getTransactionCategory,
  isTransactionCategoryId,
  isTransactionType,
} from "../utils/transaction-options";

const EPOCH_ISO = new Date(0).toISOString();

/**
 * Converts a Firestore document into a Transaction. Invalid documents return
 * null so one malformed record cannot break the whole history.
 */
export function mapTransactionDocument(
  id: string,
  data: Record<string, unknown>,
  ownerId: string,
): Transaction | null {
  if (!isTransactionType(data.type)) return null;

  const amount =
    typeof data.amount === "number" && Number.isFinite(data.amount)
      ? roundMoney(data.amount)
      : null;
  if (amount === null || amount <= 0) return null;

  if (!isCurrencyCode(data.currency)) return null;

  const walletId =
    typeof data.walletId === "string" ? data.walletId.trim() : "";
  if (walletId.length === 0) return null;

  const concept =
    typeof data.concept === "string" ? data.concept.trim() : "";
  if (concept.length === 0) return null;

  const date = toIsoDateValue(data.date);
  if (!date) return null;

  const categoryId =
    isTransactionCategoryId(data.categoryId) &&
    getTransactionCategory(data.categoryId).type === data.type
      ? data.categoryId
      : getDefaultCategoryId(data.type);

  const notes =
    typeof data.notes === "string" && data.notes.trim().length > 0
      ? data.notes.trim()
      : undefined;

  const storedOwnerId =
    typeof data.ownerId === "string" && data.ownerId.trim().length > 0
      ? data.ownerId
      : ownerId;

  const createdAt = toIsoTimestamp(data.createdAt) ?? EPOCH_ISO;
  const updatedAt = toIsoTimestamp(data.updatedAt) ?? createdAt;

  return {
    id,
    type: data.type,
    amount,
    currency: data.currency,
    walletId,
    categoryId,
    concept,
    ...(notes ? { notes } : {}),
    date,
    ownerId: storedOwnerId,
    createdAt,
    updatedAt,
  };
}
