import { useCallback, useMemo, useRef, useState } from "react";
import { useFocusEffect, useRouter, type Href } from "expo-router";

import { useCategories } from "@/features/categories/hooks/use-categories";
import { useWallets } from "@/features/wallets/hooks/use-wallets";
import { getActiveWallets } from "@/features/wallets/utils/wallet-status";

import { useTransactionDetailDialog } from "./use-transaction-detail-dialog";
import { useTransactionFormDialog } from "./use-transaction-form-dialog";
import { useTransactions } from "./use-transactions";
import type { Transaction } from "../types/transaction.types";
import type { TransactionFilters } from "../utils/transaction-filters";

/** Orchestration of the movements screen: data, dialogs, filters and routing. */
export function useTransactionsScreen() {
  const router = useRouter();
  const { wallets, refresh: refreshWallets } = useWallets();
  const categoriesState = useCategories();
  const transactionsState = useTransactions({
    categories: categoriesState.categories,
  });
  const [filtersVisible, setFiltersVisible] = useState(false);
  const hasFocusedOnce = useRef(false);

  // Categories and wallets can change in other tabs; refresh them when the tab
  // is focused again so the form and filters never show stale options.
  useFocusEffect(
    useCallback(() => {
      if (!hasFocusedOnce.current) {
        hasFocusedOnce.current = true;
        return;
      }

      void categoriesState.refresh();
      void refreshWallets();
    }, [categoriesState.refresh, refreshWallets]),
  );

  const walletMap = useMemo(
    () => new Map(wallets.map((wallet) => [wallet.id, wallet])),
    [wallets],
  );
  const activeWallets = useMemo(() => getActiveWallets(wallets), [wallets]);
  const dialog = useTransactionFormDialog({
    mutating: transactionsState.mutating,
    createTransaction: transactionsState.createTransaction,
    updateTransaction: transactionsState.updateTransaction,
    deleteTransaction: transactionsState.deleteTransaction,
    clearMutationState: transactionsState.clearMutationState,
  });
  const detail = useTransactionDetailDialog(transactionsState.transactions);

  const hasFilters = transactionsState.activeFilterCount > 0;
  const screenLoading =
    transactionsState.loading || categoriesState.loading;
  const screenError = transactionsState.error ?? categoriesState.error;
  const showChrome = !screenLoading && !screenError;

  function retryLoad() {
    void transactionsState.reload();
    void categoriesState.reload();
  }

  function refreshAll() {
    void transactionsState.refresh();
    void categoriesState.refresh();
  }

  function applyFilters(filters: TransactionFilters) {
    transactionsState.setFilters(filters);
    setFiltersVisible(false);
  }

  function clearFilters() {
    transactionsState.resetFilters();
    setFiltersVisible(false);
  }

  function openDetail(transaction: Transaction) {
    // A linked movement belongs to its shared expense: the personal detail (and
    // its edit/delete actions) must never open for it.
    if (transaction.sharedExpenseId) {
      router.push(`/social/expenses/${transaction.sharedExpenseId}` as Href);
      return;
    }

    transactionsState.clearMutationState();
    detail.open(transaction);
  }

  function editFromDetail(transaction: Transaction) {
    detail.close();
    dialog.openEdit(transaction);
  }

  return {
    wallets,
    activeWallets,
    categories: categoriesState.categories,
    walletMap,
    filteredTransactions: transactionsState.filteredTransactions,
    filters: transactionsState.filters,
    activeFilterCount: transactionsState.activeFilterCount,
    refreshing: transactionsState.refreshing,
    mutating: transactionsState.mutating,
    mutationError: transactionsState.mutationError,
    mutationFieldErrors: transactionsState.mutationFieldErrors,
    dialog,
    detail,
    filtersVisible,
    hasFilters,
    screenLoading,
    screenError,
    showChrome,
    openFilters: () => setFiltersVisible(true),
    closeFilters: () => setFiltersVisible(false),
    retryLoad,
    refreshAll,
    applyFilters,
    clearFilters,
    openDetail,
    editFromDetail,
    deleteTransaction: transactionsState.deleteTransaction,
    addCategory: categoriesState.addCategory,
  };
}
