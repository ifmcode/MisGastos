import { isCurrencyCode } from "@/shared/constants/currencies";

import { roundMoney } from "@/features/wallets/utils/money";
import {
  toIsoDateValue,
  toIsoTimestamp,
} from "@/features/transactions/utils/transaction-date";

import { Transfer } from "../types/transfer.types";

const EPOCH_ISO = new Date(0).toISOString();

/**
 * Converts a Firestore document into a Transfer. Invalid documents return null
 * so one malformed record cannot break the whole history.
 */
export function mapTransferDocument(
  id: string,
  data: Record<string, unknown>,
  ownerId: string,
): Transfer | null {
  const fromWalletId =
    typeof data.fromWalletId === "string" ? data.fromWalletId.trim() : "";
  const toWalletId =
    typeof data.toWalletId === "string" ? data.toWalletId.trim() : "";

  if (fromWalletId.length === 0 || toWalletId.length === 0) return null;
  if (fromWalletId === toWalletId) return null;

  const amount =
    typeof data.amount === "number" && Number.isFinite(data.amount)
      ? roundMoney(data.amount)
      : null;
  if (amount === null || amount <= 0) return null;

  if (!isCurrencyCode(data.currency)) return null;

  const date = toIsoDateValue(data.date);
  if (!date) return null;

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
  const deletedAt = toIsoTimestamp(data.deletedAt);

  return {
    id,
    fromWalletId,
    toWalletId,
    amount,
    currency: data.currency,
    date,
    ...(notes ? { notes } : {}),
    ownerId: storedOwnerId,
    createdAt,
    updatedAt,
    ...(deletedAt ? { deletedAt } : {}),
  };
}
