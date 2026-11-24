import { isCurrencyCode } from "@/shared/constants/currencies";

import type { Transaction } from "../types/transaction.types";
import { mapTransactionDocument } from "./transaction.mapper";

/**
 * Result entity of a soft delete. A mappable document returns its full mapped
 * shape; a legacy one (missing currency or date) falls back to a minimal
 * placeholder so a completed delete never surfaces as a failure.
 */
export function buildDeletedTransactionResult(
  transactionId: string,
  ownerId: string,
  data: Record<string, unknown>,
  now: string,
  revision: number,
  deletedAt: string,
): Transaction {
  const mapped = mapTransactionDocument(
    transactionId,
    { ...data, deletedAt, updatedAt: now, revision },
    ownerId,
  );

  if (mapped) return mapped;

  return {
    id: transactionId,
    type: data.type === "income" ? "income" : "expense",
    amount: 0,
    currency: isCurrencyCode(data.currency) ? data.currency : "EUR",
    walletId: typeof data.walletId === "string" ? data.walletId : "",
    categoryId: typeof data.categoryId === "string" ? data.categoryId : "",
    concept: "",
    date: "",
    ownerId,
    revision,
    createdAt: now,
    updatedAt: now,
    deletedAt,
  };
}
