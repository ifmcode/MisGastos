import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Wallet } from "@/features/wallets/types/wallet.types";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { useTransactionFiltersForm } from "../hooks/use-transaction-filters-form";
import { transactionFiltersStyles as styles } from "../styles/transaction-filters.styles";
import {
  TransactionFilters,
  TransactionSortOrder,
} from "../utils/transaction-filters";
import {
  getCategoriesForType,
  TRANSACTION_TYPE_OPTIONS,
} from "../utils/transaction-options";
import { TransactionType } from "../types/transaction.types";
import { TransactionFiltersActions } from "./transaction-filters-actions";
import { TransactionFiltersChipGroup } from "./transaction-filters-chip-group";
import { TransactionFiltersDateRange } from "./transaction-filters-date-range";
import { TransactionFiltersHeader } from "./transaction-filters-header";
import {
  TransactionFiltersOption,
  TransactionFiltersOptionRow,
} from "./transaction-filters-option-row";

export interface TransactionFiltersModalProps {
  wallets: Wallet[];
  filters: TransactionFilters;
  onApply: (filters: TransactionFilters) => void;
  onReset: () => void;
  onCancel: () => void;
}

const SORT_OPTIONS: ReadonlyArray<
  TransactionFiltersOption<TransactionSortOrder>
> = [
  { value: "desc", label: "Más recientes primero" },
  { value: "asc", label: "Más antiguos primero" },
];

const TYPE_OPTIONS: ReadonlyArray<
  TransactionFiltersOption<TransactionType | "all">
> = [{ value: "all", label: "Todos" }, ...TRANSACTION_TYPE_OPTIONS];

export function TransactionFiltersModal({
  wallets,
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
    updateFilters,
    changeFromDate,
    changeToDate,
    apply,
  } = useTransactionFiltersForm({ filters, onApply });

  const categoryType =
    localFilters.type === "all" ? ("expense" as const) : localFilters.type;

  const walletOptions: TransactionFiltersOption<string>[] = [
    { value: "", label: "Todas" },
    ...wallets.map((wallet) => ({ value: wallet.id, label: wallet.name })),
  ];

  const categoryOptions: TransactionFiltersOption<string>[] = [
    { value: "", label: "Todas" },
    ...getCategoriesForType(categoryType).map((category) => ({
      value: category.id,
      label: category.label,
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
              options={SORT_OPTIONS}
              selectedValue={localFilters.sort}
              onSelect={(sort) => updateFilters({ sort })}
            />

            <ThemedText style={styles.label}>Tipo</ThemedText>
            <TransactionFiltersOptionRow
              options={TYPE_OPTIONS}
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
              toText={toText}
              onChangeFrom={changeFromDate}
              onChangeTo={changeToDate}
            />

            <TransactionFiltersActions onReset={onReset} onApply={apply} />
          </ScrollView>
        </ThemedView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
