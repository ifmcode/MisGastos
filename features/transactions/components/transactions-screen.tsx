import { useCallback, useMemo, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedView } from "@/components/themed-view";
import { useCategories } from "@/features/categories/hooks/use-categories";
import { useWallets } from "@/features/wallets/hooks/use-wallets";
import { getActiveWallets } from "@/features/wallets/utils/wallet-status";

import { useTransactionFormDialog } from "../hooks/use-transaction-form-dialog";
import { useTransactions } from "../hooks/use-transactions";
import { transactionsStyles as styles } from "../styles/transactions.styles";
import { TransactionFilters } from "../utils/transaction-filters";
import { TransactionsErrorState } from "./transactions-error-state";
import { TransactionsFab } from "./transactions-fab";
import { TransactionsFiltersDialog } from "./transactions-filters-dialog";
import { TransactionsFormModal } from "./transactions-form-modal";
import { TransactionsHeader } from "./transactions-header";
import { TransactionsList } from "./transactions-list";
import { TransactionsLoadingState } from "./transactions-loading-state";

export function TransactionsScreen() {
  const insets = useSafeAreaInsets();
  const { wallets } = useWallets();
  const {
    categories,
    loading: categoriesLoading,
    error: categoriesError,
    reload: reloadCategories,
    refresh: refreshCategories,
    addCategory,
  } = useCategories();
  const {
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

  // Categories can change in the settings flow; refresh them when the tab is
  // focused again so the form and filters never show stale options.
  useFocusEffect(
    useCallback(() => {
      if (!hasFocusedOnce.current) {
        hasFocusedOnce.current = true;
        return;
      }

      void refreshCategories();
    }, [refreshCategories]),
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

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <TransactionsHeader
        showActions={showChrome}
        hasFilters={hasFilters}
        onOpenFilters={() => setIsFiltersVisible(true)}
        onCreate={dialog.openCreate}
      />

      {screenLoading ? (
        <TransactionsLoadingState />
      ) : screenError ? (
        <TransactionsErrorState message={screenError} onRetry={retryLoad} />
      ) : (
        <TransactionsList
          transactions={filteredTransactions}
          walletMap={walletMap}
          categories={categories}
          hasFilters={hasFilters}
          activeFilterCount={activeFilterCount}
          refreshing={refreshing}
          onRefresh={refreshAll}
          onEdit={dialog.openEdit}
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
