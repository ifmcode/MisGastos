import { Transfer } from "@/features/transfers/types/transfer.types";
import { sortTransfersByDate } from "@/features/transfers/utils/transfer-sort";
import { Transaction } from "@/features/transactions/types/transaction.types";
import { sortTransactions } from "@/features/transactions/utils/transaction-filters";

export const DASHBOARD_RECENT_LIMIT = 3;

export interface RecentSection<T> {
  items: T[];
  hasMore: boolean;
}

/** Newest movements first, capped for the home summary. */
export function getRecentMovements(
  transactions: readonly Transaction[],
  limit: number = DASHBOARD_RECENT_LIMIT,
): RecentSection<Transaction> {
  const sorted = sortTransactions(transactions, "desc");

  return {
    items: sorted.slice(0, limit),
    hasMore: sorted.length > limit,
  };
}

/** Newest transfers first, capped for the home summary. */
export function getRecentTransfers(
  transfers: readonly Transfer[],
  limit: number = DASHBOARD_RECENT_LIMIT,
): RecentSection<Transfer> {
  const sorted = sortTransfersByDate(transfers);

  return {
    items: sorted.slice(0, limit),
    hasMore: sorted.length > limit,
  };
}
