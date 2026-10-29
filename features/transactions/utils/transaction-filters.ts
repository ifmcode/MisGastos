import { Transaction, TransactionType } from "../types/transaction.types";
import { parseDateInput } from "./transaction-date";

export type TransactionSortOrder = "asc" | "desc";

export interface TransactionFilters {
  walletId: string;
  type: TransactionType | "all";
  categoryId: string;
  fromDate: string;
  toDate: string;
  sort: TransactionSortOrder;
}

export const DEFAULT_TRANSACTION_FILTERS: TransactionFilters = {
  walletId: "",
  type: "all",
  categoryId: "",
  fromDate: "",
  toDate: "",
  sort: "desc",
};

export function filterTransactions(
  transactions: readonly Transaction[],
  filters: TransactionFilters,
): Transaction[] {
  const fromDate = filters.fromDate.trim()
    ? parseDateInput(filters.fromDate)
    : null;
  const toDate = filters.toDate.trim() ? parseDateInput(filters.toDate) : null;

  return transactions.filter((transaction) => {
    if (filters.walletId && transaction.walletId !== filters.walletId) {
      return false;
    }

    if (filters.type !== "all" && transaction.type !== filters.type) {
      return false;
    }

    if (
      filters.categoryId &&
      transaction.categoryId !== filters.categoryId
    ) {
      return false;
    }

    if (fromDate && transaction.date < fromDate) return false;
    if (toDate && transaction.date > toDate) return false;

    return true;
  });
}

function toTimestamp(value: string | Date): number {
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

/**
 * Dates are ISO calendar strings, so lexical comparison is enough. CreatedAt
 * is used as a stable tie-breaker for transactions on the same day.
 */
export function sortTransactions(
  transactions: readonly Transaction[],
  order: TransactionSortOrder,
): Transaction[] {
  return [...transactions].sort((first, second) => {
    const dateComparison = first.date.localeCompare(second.date);

    if (dateComparison !== 0) {
      return order === "asc" ? dateComparison : -dateComparison;
    }

    const createdComparison =
      toTimestamp(first.createdAt) - toTimestamp(second.createdAt);

    return order === "asc" ? createdComparison : -createdComparison;
  });
}

export function countActiveFilters(filters: TransactionFilters): number {
  let count = 0;

  if (filters.walletId) count += 1;
  if (filters.type !== "all") count += 1;
  if (filters.categoryId) count += 1;
  if (filters.fromDate.trim()) count += 1;
  if (filters.toDate.trim()) count += 1;
  if (filters.sort !== DEFAULT_TRANSACTION_FILTERS.sort) count += 1;

  return count;
}
