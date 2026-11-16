import { isCurrencyCode } from "@/shared/constants/currencies";

import { roundMoney } from "@/features/wallets/utils/money";

import { Transaction } from "../types/transaction.types";
import {
  toIsoDateValue,
  toIsoTimestamp,
} from "@/shared/utils/date";
import { isTransactionType } from "../utils/transaction-options";

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

  const walletName =
    typeof data.walletName === "string" && data.walletName.trim().length > 0
      ? data.walletName.trim()
      : undefined;

  const date = toIsoDateValue(data.date);
  if (!date) return null;

  const categoryId =
    typeof data.categoryId === "string" ? data.categoryId.trim() : "";

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

  // A non-empty stamp means soft-deleted: keep it raw instead of normalizing so
  // a malformed value never resurrects the record in the movements list.
  const deletedAt =
    typeof data.deletedAt === "string" && data.deletedAt.trim().length > 0
      ? data.deletedAt.trim()
      : null;

  const sharedExpenseId = readSharedExpenseId(data);

  return {
    id,
    type: data.type,
    amount,
    currency: data.currency,
    walletId,
    ...(walletName ? { walletName } : {}),
    categoryId,
    concept,
    ...(notes ? { notes } : {}),
    date,
    ownerId: storedOwnerId,
    ...(sharedExpenseId ? { sharedExpenseId } : {}),
    createdAt,
    updatedAt,
    deletedAt,
  };
}

/** Linked ids only belong to expenses; anything else is dropped, not rejected. */
function readSharedExpenseId(data: Record<string, unknown>): string | null {
  if (data.type !== "expense") return null;

  return typeof data.sharedExpenseId === "string" &&
    data.sharedExpenseId.trim().length > 0
    ? data.sharedExpenseId.trim()
    : null;
}
