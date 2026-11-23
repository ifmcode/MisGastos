import { useCallback, useMemo, useRef, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";

import { useCategories } from "@/features/categories/hooks/use-categories";
import { useProfile } from "@/features/profile/hooks/use-profile";
import { useWallets } from "@/features/wallets/hooks/use-wallets";
import { getActiveWallets } from "@/features/wallets/utils/wallet-status";
import { DEFAULT_CURRENCY } from "@/shared/constants/currencies";

import { useTransactionDetailDialog } from "./use-transaction-detail-dialog";
import { useTransactionFormDialog } from "./use-transaction-form-dialog";
import { useTransactions } from "./use-transactions";
import { useTransactionsCreateMenu } from "./use-transactions-create-menu";
import type { Transaction } from "../types/transaction.types";
import { getTransactionDetailTarget } from "../utils/transaction-detail-target";
import type { TransactionFilters } from "../utils/transaction-filters";

/** Orchestration of the movements screen: data, dialogs, filters and routing. */
export function useTransactionsScreen() {
  const router = useRouter();
  const { wallets, refresh: refreshWallets } = useWallets();
  const { profile } = useProfile();
  const preferredCurrency = profile?.preferredCurrency ?? DEFAULT_CURRENCY;
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
  // A linked movement created from the shared-expense form must appear without
  // a manual pull-to-refresh, so both sources reload after any create.
  const refreshAfterCreate = useCallback(() => {
    void transactionsState.refresh();
    void refreshWallets();
  }, [transactionsState.refresh, refreshWallets]);
  const dialog = useTransactionFormDialog({
    mutating: transactionsState.mutating,
    createTransaction: transactionsState.createTransaction,
    updateTransaction: transactionsState.updateTransaction,
    deleteTransaction: transactionsState.deleteTransaction,
    clearMutationState: transactionsState.clearMutationState,
    onCreated: refreshAfterCreate,
  });
  const detail = useTransactionDetailDialog(transactionsState.transactions);
  const createMenu = useTransactionsCreateMenu({
    openMovementForm: dialog.openCreate,
    onChanged: refreshAfterCreate,
  });

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
    const target = getTransactionDetailTarget(transaction);

    if (target) {
      router.push(target);
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
    preferredCurrency,
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
    createMenu,
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
