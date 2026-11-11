import { FlatList, View } from "react-native";

import { Category } from "@/features/categories/types/category.types";
import { Wallet } from "@/features/wallets/types/wallet.types";

import { transactionsStyles as styles } from "../styles/transactions.styles";
import { Transaction } from "../types/transaction.types";
import { getTransactionCategory } from "../utils/transaction-options";
import { TransactionItem } from "./transaction-item";
import { TransactionsActiveFiltersHeader } from "./transactions-active-filters-header";
import { TransactionsEmptyState } from "./transactions-empty-state";

export interface TransactionsListProps {
  transactions: readonly Transaction[];
  walletMap: ReadonlyMap<string, Wallet>;
  categories: readonly Category[];
  hasFilters: boolean;
  activeFilterCount: number;
  refreshing: boolean;
  onRefresh: () => void;
  onOpenDetail: (transaction: Transaction) => void;
  onCreate: () => void;
  onClearFilters: () => void;
}

function TransactionSeparator() {
  return <View style={styles.separator} />;
}

export function TransactionsList({
  transactions,
  walletMap,
  categories,
  hasFilters,
  activeFilterCount,
  refreshing,
  onRefresh,
  onOpenDetail,
  onCreate,
  onClearFilters,
}: TransactionsListProps) {
  return (
    <FlatList
      data={transactions}
      keyExtractor={(transaction) => transaction.id}
      renderItem={({ item }) => (
        <TransactionItem
          transaction={item}
          wallet={walletMap.get(item.walletId)}
          category={getTransactionCategory(categories, item.categoryId)}
          onPress={() => onOpenDetail(item)}
        />
      )}
      ItemSeparatorComponent={TransactionSeparator}
      ListHeaderComponent={
        hasFilters ? (
          <TransactionsActiveFiltersHeader
            resultCount={transactions.length}
            activeFilterCount={activeFilterCount}
            onClearFilters={onClearFilters}
          />
        ) : undefined
      }
      ListEmptyComponent={
        <TransactionsEmptyState
          hasFilters={hasFilters}
          onCreate={onCreate}
          onClearFilters={onClearFilters}
        />
      }
      contentContainerStyle={[
        styles.listContent,
        transactions.length === 0 && styles.emptyListContent,
      ]}
      refreshing={refreshing}
      onRefresh={onRefresh}
      showsVerticalScrollIndicator={false}
    />
  );
}
