import { useMemo, useState } from "react";
import { FlatList, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedView } from "@/components/themed-view";
import { useWallets } from "@/features/wallets/hooks/use-wallets";

import { useTransactionFormDialog } from "../hooks/use-transaction-form-dialog";
import { useTransactions } from "../hooks/use-transactions";
import { transactionsStyles as styles } from "../styles/transactions.styles";
import { Transaction } from "../types/transaction.types";
import { TransactionFilters } from "../utils/transaction-filters";
import { getTransactionCategory } from "../utils/transaction-options";
import { TransactionFiltersModal } from "./transaction-filters-modal";
import { TransactionItem } from "./transaction-item";
import { TransactionsActiveFiltersHeader } from "./transactions-active-filters-header";
import { TransactionsEmptyState } from "./transactions-empty-state";
import { TransactionsErrorState } from "./transactions-error-state";
import { TransactionsFab } from "./transactions-fab";
import { TransactionsFiltersDialog } from "./transactions-filters-dialog";
import { TransactionsFormModal } from "./transactions-form-modal";
import { TransactionsHeader } from "./transactions-header";
import { TransactionsLoadingState } from "./transactions-loading-state";

function TransactionSeparator() {
  return <View style={styles.separator} />;
}

export function TransactionsScreen() {
  const insets = useSafeAreaInsets();
  const { wallets } = useWallets();
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
  } = useTransactions();

  const [isFiltersVisible, setIsFiltersVisible] = useState(false);

  const walletMap = useMemo(
    () => new Map(wallets.map((wallet) => [wallet.id, wallet])),
    [wallets],
  );

  const dialog = useTransactionFormDialog({
    walletMap,
    mutating,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    clearMutationState,
  });

  const hasFilters = activeFilterCount > 0;
  const showChrome = !loading && !error;

  function renderItem({ item }: { item: Transaction }) {
    return (
      <TransactionItem
        transaction={item}
        wallet={walletMap.get(item.walletId)}
        category={getTransactionCategory(item.categoryId)}
        onPress={() => dialog.openEdit(item)}
      />
    );
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

      {loading ? (
        <TransactionsLoadingState />
      ) : error ? (
        <TransactionsErrorState message={error} onRetry={() => void reload()} />
      ) : (
        <FlatList
          data={filteredTransactions}
          keyExtractor={(transaction) => transaction.id}
          renderItem={renderItem}
          ItemSeparatorComponent={TransactionSeparator}
          ListHeaderComponent={
            hasFilters ? (
              <TransactionsActiveFiltersHeader
                resultCount={filteredTransactions.length}
                activeFilterCount={activeFilterCount}
                onClearFilters={resetFilters}
              />
            ) : null
          }
          ListEmptyComponent={
            <TransactionsEmptyState
              hasFilters={hasFilters}
              onCreate={dialog.openCreate}
              onClearFilters={resetFilters}
            />
          }
          contentContainerStyle={[
            styles.listContent,
            filteredTransactions.length === 0 && styles.emptyListContent,
          ]}
          refreshing={refreshing}
          onRefresh={() => void refresh()}
          showsVerticalScrollIndicator={false}
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
        wallets={wallets}
        editingTransaction={dialog.editingTransaction}
        onSubmit={(input) => void dialog.submit(input)}
        onDelete={dialog.requestDelete}
        onClose={dialog.close}
      />

      <TransactionsFiltersDialog
        visible={isFiltersVisible}
        wallets={wallets}
        filters={filters}
        onApply={applyFilters}
        onReset={clearFilters}
        onClose={() => setIsFiltersVisible(false)}
      />
    </ThemedView>
  );
}
