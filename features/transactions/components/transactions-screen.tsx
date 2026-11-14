import { useCallback, useMemo, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedView } from "@/components/themed-view";
import { useCategories } from "@/features/categories/hooks/use-categories";
import { useWallets } from "@/features/wallets/hooks/use-wallets";
import { getActiveWallets } from "@/features/wallets/utils/wallet-status";
import { ErrorState } from "@/shared/components/molecules/error-state";
import { LoadingState } from "@/shared/components/molecules/loading-state";

import { useTransactionDetailDialog } from "../hooks/use-transaction-detail-dialog";
import { useTransactionFormDialog } from "../hooks/use-transaction-form-dialog";
import { useTransactions } from "../hooks/use-transactions";
import { transactionsStyles as styles } from "../styles/transactions.styles";
import { Transaction } from "../types/transaction.types";
import { TransactionFilters } from "../utils/transaction-filters";
import { TransactionDetailModal } from "./transaction-detail-modal";
import { TransactionsFab } from "./transactions-fab";
import { TransactionsFiltersDialog } from "./transactions-filters-dialog";
import { TransactionsFormModal } from "./transactions-form-modal";
import { TransactionsHeader } from "./transactions-header";
import { TransactionsList } from "./transactions-list";

export function TransactionsScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation(["transactions", "common"]);
  const { wallets, refresh: refreshWallets } = useWallets();
  const {
    categories,
    loading: categoriesLoading,
    error: categoriesError,
    reload: reloadCategories,
    refresh: refreshCategories,
    addCategory,
  } = useCategories();
  const {
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
  } = useTransactions({ categories });

  const [isFiltersVisible, setIsFiltersVisible] = useState(false);
  const hasFocusedOnce = useRef(false);

  // Categories and wallets can change in other tabs; refresh them when the tab
  // is focused again so the form and filters never show stale options. The
  // wallet refresh is what keeps a newly created wallet (for example a third
  // one) from disappearing from the movement form.
  useFocusEffect(
    useCallback(() => {
      if (!hasFocusedOnce.current) {
        hasFocusedOnce.current = true;
        return;
      }

      void refreshCategories();
      void refreshWallets();
    }, [refreshCategories, refreshWallets]),
  );

  const walletMap = useMemo(
    () => new Map(wallets.map((wallet) => [wallet.id, wallet])),
    [wallets],
  );
  const activeWallets = useMemo(() => getActiveWallets(wallets), [wallets]);

  const dialog = useTransactionFormDialog({
    mutating,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    clearMutationState,
  });
  const detail = useTransactionDetailDialog(transactions);

  const hasFilters = activeFilterCount > 0;
  const screenLoading = loading || categoriesLoading;
  const screenError = error ?? categoriesError;
  const showChrome = !screenLoading && !screenError;

  function retryLoad() {
    void reload();
    void reloadCategories();
  }

  function refreshAll() {
    void refresh();
    void refreshCategories();
  }

  function applyFilters(next: TransactionFilters) {
    setFilters(next);
    setIsFiltersVisible(false);
  }

  function clearFilters() {
    resetFilters();
    setIsFiltersVisible(false);
  }

  function openDetail(transaction: Transaction) {
    clearMutationState();
    detail.open(transaction);
  }

  function editFromDetail(transaction: Transaction) {
    detail.close();
    dialog.openEdit(transaction);
  }

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <TransactionsHeader
        showActions={showChrome}
        hasFilters={hasFilters}
        onOpenFilters={() => setIsFiltersVisible(true)}
        onCreate={dialog.openCreate}
      />

      {screenLoading ? (
        <LoadingState message={t("loading")} />
      ) : screenError ? (
        <ErrorState
          title={t("errorTitle")}
          message={screenError}
          retryLabel={t("common:actions.retry")}
          retryAccessibilityLabel={t("retryAccessibility")}
          onRetry={retryLoad}
        />
      ) : (
        <TransactionsList
          transactions={filteredTransactions}
          walletMap={walletMap}
          categories={categories}
          hasFilters={hasFilters}
          activeFilterCount={activeFilterCount}
          refreshing={refreshing}
          onRefresh={refreshAll}
          onOpenDetail={openDetail}
          onCreate={dialog.openCreate}
          onClearFilters={resetFilters}
        />
      )}

      {showChrome ? (
        <TransactionsFab
          bottom={insets.bottom + 24}
          onPress={dialog.openCreate}
        />
      ) : null}

      <TransactionDetailModal
        visible={detail.visible}
        transaction={detail.transaction}
        wallets={wallets}
        categories={categories}
        mutating={mutating}
        error={mutationError}
        onEdit={editFromDetail}
        onDelete={deleteTransaction}
        onClose={detail.close}
      />

      <TransactionsFormModal
        visible={dialog.visible}
        mutating={mutating}
        error={mutationError}
        fieldErrors={mutationFieldErrors}
        wallets={activeWallets}
        walletLookup={wallets}
        categories={categories}
        editingTransaction={dialog.editingTransaction}
        onSubmit={(input) => void dialog.submit(input)}
        onDelete={dialog.deleteEditing}
        onClose={dialog.close}
        onCategoryCreated={addCategory}
      />

      <TransactionsFiltersDialog
        visible={isFiltersVisible}
        wallets={activeWallets}
        categories={categories}
        filters={filters}
        onApply={applyFilters}
        onReset={clearFilters}
        onClose={() => setIsFiltersVisible(false)}
      />
    </ThemedView>
  );
}
