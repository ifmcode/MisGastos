import { useCallback, useMemo, useState } from "react";

import { Category } from "@/features/categories/types/category.types";
import { useAuth } from "@/hooks/use-auth";
import { useAsyncCollection } from "@/shared/hooks/use-async-collection";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import {
  TransactionInput,
  TransactionValidationErrors,
} from "../schemas/transaction.schema";
import { getTransactionErrorCode } from "../services/transaction.errors";
import { Transaction } from "../types/transaction.types";
import {
  countActiveFilters,
  DEFAULT_TRANSACTION_FILTERS,
  filterTransactions,
  sortTransactions,
  TransactionFilters,
} from "../utils/transaction-filters";
import { useTransactionMutations } from "./use-transaction-mutations";
import { useTransactionService } from "./use-transaction-service";

export interface UseTransactionsResult {
  transactions: Transaction[];
  filteredTransactions: Transaction[];
  filters: TransactionFilters;
  activeFilterCount: number;
  loading: boolean;
  refreshing: boolean;
  mutating: boolean;
  error: string | null;
  mutationError: string | null;
  mutationFieldErrors: TransactionValidationErrors;
  reload: () => Promise<void>;
  refresh: () => Promise<void>;
  setFilters: (filters: TransactionFilters) => void;
  resetFilters: () => void;
  createTransaction: (input: TransactionInput) => Promise<boolean>;
  updateTransaction: (
    transactionId: string,
    input: TransactionInput,
  ) => Promise<boolean>;
  deleteTransaction: (transactionId: string) => Promise<boolean>;
  clearMutationState: () => void;
}

export interface UseTransactionsOptions {
  categories?: readonly Category[];
}

/** Loads the owner's movements and exposes filtering plus mutations. */
export function useTransactions({
  categories = [],
}: UseTransactionsOptions = {}): UseTransactionsResult {
  const { user } = useAuth();
  const { tr } = useScopedTranslation("transactions");
  const ownerId = user?.uid;
  const transactionService = useTransactionService();

  const loadTransactions = useCallback(
    (currentOwnerId: string) =>
      transactionService.getTransactions(currentOwnerId),
    [transactionService],
  );
  const describeLoadError = useCallback(
    (error: unknown) =>
      tr(`errors.${getTransactionErrorCode(error, "LOAD_FAILED")}`),
    [tr],
  );

  const {
    items: transactions,
    setItems: setTransactions,
    loading,
    refreshing,
    error,
    reload,
    refresh,
  } = useAsyncCollection<Transaction>({
    ownerId,
    load: loadTransactions,
    describeError: describeLoadError,
  });

  const mutations = useTransactionMutations({ ownerId, setTransactions });

  const [filters, setFilters] =
    useState<TransactionFilters>(DEFAULT_TRANSACTION_FILTERS);

  const filteredTransactions = useMemo(
    () =>
      sortTransactions(
        filterTransactions(transactions, filters, categories),
        filters.sort,
      ),
    [transactions, filters, categories],
  );

  const activeFilterCount = useMemo(
    () => countActiveFilters(filters),
    [filters],
  );

  const resetFilters = useCallback(
    () => setFilters(DEFAULT_TRANSACTION_FILTERS),
    [],
  );

  return {
    transactions,
    filteredTransactions,
    filters,
    activeFilterCount,
    loading,
    refreshing,
    error,
    reload,
    refresh,
    setFilters,
    resetFilters,
    ...mutations,
  };
}
