import { TransactionType } from "../types/transaction.types";
import { TransactionSortOrder } from "./transaction-filters";
import { TRANSACTION_TYPE_OPTIONS } from "./transaction-options";

export interface TransactionFiltersOption<T extends string> {
  value: T;
  /** Translation key for static options. */
  labelKey?: string;
  /** User data (wallet or category name) for dynamic options. */
  label?: string;
}

export const TRANSACTION_SORT_OPTIONS: ReadonlyArray<
  TransactionFiltersOption<TransactionSortOrder>
> = [
  { value: "desc", labelKey: "filters.sortNewest" },
  { value: "asc", labelKey: "filters.sortOldest" },
];

export const TRANSACTION_TYPE_FILTER_OPTIONS: ReadonlyArray<
  TransactionFiltersOption<TransactionType | "all">
> = [
  { value: "all", labelKey: "filters.allTypes" },
  ...TRANSACTION_TYPE_OPTIONS,
];
