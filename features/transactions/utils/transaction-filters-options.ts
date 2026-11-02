import { TransactionType } from "../types/transaction.types";
import { TransactionSortOrder } from "./transaction-filters";
import { TRANSACTION_TYPE_OPTIONS } from "./transaction-options";

export interface TransactionFiltersOption<T extends string> {
  value: T;
  label: string;
}

export const TRANSACTION_SORT_OPTIONS: ReadonlyArray<
  TransactionFiltersOption<TransactionSortOrder>
> = [
  { value: "desc", label: "Más recientes primero" },
  { value: "asc", label: "Más antiguos primero" },
];

export const TRANSACTION_TYPE_FILTER_OPTIONS: ReadonlyArray<
  TransactionFiltersOption<TransactionType | "all">
> = [{ value: "all", label: "Todos" }, ...TRANSACTION_TYPE_OPTIONS];
