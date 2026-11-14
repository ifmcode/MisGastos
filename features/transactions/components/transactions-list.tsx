import { useTranslation } from "react-i18next";
import { FlatList, View } from "react-native";

import { Category } from "@/features/categories/types/category.types";
import { Wallet } from "@/features/wallets/types/wallet.types";
import { EmptyState } from "@/shared/components/molecules/empty-state";

import { transactionsStyles as styles } from "../styles/transactions.styles";
import { Transaction } from "../types/transaction.types";
import { getTransactionCategory } from "../utils/transaction-options";
import { TransactionItem } from "./transaction-item";
import { TransactionsActiveFiltersHeader } from "./transactions-active-filters-header";

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
  const { t } = useTranslation("transactions");

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
        <EmptyState
          icon="receipt-outline"
          title={hasFilters ? t("emptyFilteredTitle") : t("emptyTitle")}
          message={hasFilters ? t("emptyFilteredMessage") : t("emptyMessage")}
          primaryAction={
            hasFilters
              ? undefined
              : {
                  label: t("create"),
                  accessibilityLabel: t("createFirst"),
                  onPress: onCreate,
                  icon: "add",
                }
          }
          secondaryAction={
            hasFilters
              ? {
                  label: t("filters.clearFilters"),
                  accessibilityLabel: t("filters.clearAccessibility"),
                  onPress: onClearFilters,
                }
              : undefined
          }
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
