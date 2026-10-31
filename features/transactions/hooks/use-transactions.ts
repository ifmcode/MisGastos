import { useCallback, useMemo, useState } from "react";

import { useAuth } from "@/hooks/use-auth";
import { useAsyncCollection } from "@/shared/hooks/use-async-collection";

import {
  TransactionInput,
  TransactionValidationErrors,
} from "../schemas/transaction.schema";
import { getTransactionErrorMessage } from "../services/transaction.errors";
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

/** Loads the owner's movements and exposes filtering plus mutations. */
export function useTransactions(): UseTransactionsResult {
  const { user } = useAuth();
  const ownerId = user?.uid;
  const transactionService = useTransactionService();

  const loadTransactions = useCallback(
    (currentOwnerId: string) =>
      transactionService.getTransactions(currentOwnerId),
    [transactionService],
  );
  const describeLoadError = useCallback(
    (error: unknown) =>
      getTransactionErrorMessage(
        error,
        "No se pudieron cargar los movimientos. Inténtalo de nuevo.",
      ),
    [],
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
        filterTransactions(transactions, filters),
        filters.sort,
      ),
    [transactions, filters],
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
