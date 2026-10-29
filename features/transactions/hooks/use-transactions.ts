import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/hooks/use-auth";
import { useWallets } from "@/features/wallets/hooks/use-wallets";

import {
  TransactionInput,
  TransactionValidationErrors,
} from "../schemas/transaction.schema";
import {
  getTransactionErrorMessage,
  TransactionOperationError,
  TransactionValidationError,
} from "../services/transaction.errors";
import { Transaction } from "../types/transaction.types";
import { useTransactionService } from "./use-transaction-service";
import {
  countActiveFilters,
  DEFAULT_TRANSACTION_FILTERS,
  filterTransactions,
  sortTransactions,
  TransactionFilters,
} from "../utils/transaction-filters";

type LoadMode = "initial" | "refresh";

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

export function useTransactions(): UseTransactionsResult {
  const { user } = useAuth();
  const transactionService = useTransactionService();
  const { reload: reloadWallets } = useWallets();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filters, setFilters] =
    useState<TransactionFilters>(DEFAULT_TRANSACTION_FILTERS);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mutating, setMutating] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [mutationFieldErrors, setMutationFieldErrors] =
    useState<TransactionValidationErrors>({});

  const loadTransactions = useCallback(
    async (mode: LoadMode) => {
      if (!user) {
        setTransactions([]);
        setError(null);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (mode === "refresh") {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      try {
        const result = await transactionService.getTransactions(user.uid);
        setTransactions(result);
      } catch (loadError: unknown) {
        setError(
          getTransactionErrorMessage(
            loadError,
            "No se pudieron cargar los movimientos. Inténtalo de nuevo.",
          ),
        );
      } finally {
        if (mode === "refresh") {
          setRefreshing(false);
        } else {
          setLoading(false);
        }
      }
    },
    [user, transactionService],
  );

  useEffect(() => {
    void loadTransactions("initial");
  }, [loadTransactions]);

  const reload = useCallback(() => loadTransactions("initial"), [loadTransactions]);
  const refresh = useCallback(() => loadTransactions("refresh"), [loadTransactions]);

  const clearMutationState = useCallback(() => {
    setMutationError(null);
    setMutationFieldErrors({});
  }, []);

  const handleMutationError = useCallback((failure: unknown) => {
    if (failure instanceof TransactionValidationError) {
      setMutationFieldErrors(failure.fieldErrors);
      setMutationError(failure.message);
      return false;
    }

    if (failure instanceof TransactionOperationError) {
      setMutationError(failure.message);
      setMutationFieldErrors({});
      return false;
    }

    setMutationFieldErrors({});
    setMutationError(
      getTransactionErrorMessage(
        failure,
        "No se pudo guardar el movimiento. Inténtalo de nuevo.",
      ),
    );
    return false;
  }, []);

  const createTransaction = useCallback(
    async (input: TransactionInput): Promise<boolean> => {
      if (!user) {
        setMutationError("Debes iniciar sesión para crear un movimiento.");
        return false;
      }

      setMutating(true);
      clearMutationState();

      try {
        const result = await transactionService.createTransaction(user.uid, input);
        setTransactions((current) => [result.transaction, ...current]);
        void reloadWallets();
        return true;
      } catch (failure: unknown) {
        return handleMutationError(failure);
      } finally {
        setMutating(false);
      }
    },
    [user, transactionService, clearMutationState, handleMutationError, reloadWallets],
  );

  const updateTransaction = useCallback(
    async (transactionId: string, input: TransactionInput): Promise<boolean> => {
      if (!user) {
        setMutationError("Debes iniciar sesión para editar un movimiento.");
        return false;
      }

      setMutating(true);
      clearMutationState();

      try {
        const result = await transactionService.updateTransaction(
          user.uid,
          transactionId,
          input,
        );
        setTransactions((current) =>
          current.map((transaction) =>
            transaction.id === transactionId
              ? result.transaction
              : transaction,
          ),
        );
        void reloadWallets();
        return true;
      } catch (failure: unknown) {
        return handleMutationError(failure);
      } finally {
        setMutating(false);
      }
    },
    [user, transactionService, clearMutationState, handleMutationError, reloadWallets],
  );

  const deleteTransaction = useCallback(
    async (transactionId: string): Promise<boolean> => {
      if (!user) {
        setMutationError("Debes iniciar sesión para eliminar un movimiento.");
        return false;
      }

      setMutating(true);
      clearMutationState();

      try {
        await transactionService.deleteTransaction(user.uid, transactionId);
        setTransactions((current) =>
          current.filter((transaction) => transaction.id !== transactionId),
        );
        void reloadWallets();
        return true;
      } catch (failure: unknown) {
        return handleMutationError(failure);
      } finally {
        setMutating(false);
      }
    },
    [user, transactionService, clearMutationState, handleMutationError, reloadWallets],
  );

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
    mutating,
    error,
    mutationError,
    mutationFieldErrors,
    reload,
    refresh,
    setFilters,
    resetFilters,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    clearMutationState,
  };
}
