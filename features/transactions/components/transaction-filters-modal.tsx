import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Category } from "@/features/categories/types/category.types";
import { Wallet } from "@/features/wallets/types/wallet.types";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { useTransactionFiltersForm } from "../hooks/use-transaction-filters-form";
import { transactionFiltersStyles as styles } from "../styles/transaction-filters.styles";
import { TransactionFilters } from "../utils/transaction-filters";
import {
  TRANSACTION_SORT_OPTIONS,
  TRANSACTION_TYPE_FILTER_OPTIONS,
  TransactionFiltersOption,
} from "../utils/transaction-filters-options";
import { TransactionFiltersActions } from "./transaction-filters-actions";
import { TransactionFiltersChipGroup } from "./transaction-filters-chip-group";
import { TransactionFiltersDateRange } from "./transaction-filters-date-range";
import { TransactionFiltersHeader } from "./transaction-filters-header";
import { TransactionFiltersOptionRow } from "./transaction-filters-option-row";

export interface TransactionFiltersModalProps {
  wallets: Wallet[];
  categories: readonly Category[];
  filters: TransactionFilters;
  onApply: (filters: TransactionFilters) => void;
  onReset: () => void;
  onCancel: () => void;
}

export function TransactionFiltersModal({
  wallets,
  categories,
  filters,
  onApply,
  onReset,
  onCancel,
}: TransactionFiltersModalProps) {
  const theme = useFormTheme();
  const {
    localFilters,
    fromText,
    toText,
    fromIso,
    toIso,
    updateFilters,
    changeFromDate,
    changeToDate,
    selectFromDate,
    selectToDate,
    apply,
  } = useTransactionFiltersForm({ filters, onApply });

  const walletOptions: TransactionFiltersOption<string>[] = [
    { value: "", label: "Todas" },
    ...wallets.map((wallet) => ({ value: wallet.id, label: wallet.name })),
  ];

  const categoryOptions: TransactionFiltersOption<string>[] = [
    { value: "", label: "Todas" },
    ...categories
      .filter(
        (category) =>
          localFilters.type === "all" || category.type === localFilters.type,
      )
      .map((category) => ({
        value: category.id,
        label: category.name,
      })),
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ThemedView
          style={styles.container}
          lightColor={theme.background}
          darkColor={theme.background}
        >
          <TransactionFiltersHeader onClose={onCancel} />

          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <ThemedText style={styles.label}>Orden</ThemedText>
            <TransactionFiltersOptionRow
              options={TRANSACTION_SORT_OPTIONS}
              selectedValue={localFilters.sort}
              onSelect={(sort) => updateFilters({ sort })}
            />

            <ThemedText style={styles.label}>Tipo</ThemedText>
            <TransactionFiltersOptionRow
              options={TRANSACTION_TYPE_FILTER_OPTIONS}
              selectedValue={localFilters.type}
              onSelect={(type) => updateFilters({ type })}
            />

            <ThemedText style={styles.label}>Cartera</ThemedText>
            <TransactionFiltersChipGroup
              options={walletOptions}
              selectedValue={localFilters.walletId}
              onSelect={(walletId) => updateFilters({ walletId })}
            />

            <ThemedText style={styles.label}>Categoría</ThemedText>
            <TransactionFiltersChipGroup
              options={categoryOptions}
              selectedValue={localFilters.categoryId}
              onSelect={(categoryId) => updateFilters({ categoryId })}
            />

            <ThemedText style={styles.label}>Rango de fechas</ThemedText>
            <TransactionFiltersDateRange
              fromText={fromText}
              fromIso={fromIso}
              toText={toText}
              toIso={toIso}
              onChangeFrom={changeFromDate}
              onChangeTo={changeToDate}
              onSelectFrom={selectFromDate}
              onSelectTo={selectToDate}
            />

            <TransactionFiltersActions onReset={onReset} onApply={apply} />
          </ScrollView>
        </ThemedView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
