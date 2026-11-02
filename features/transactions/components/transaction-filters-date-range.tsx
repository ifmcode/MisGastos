import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { DateQuickSelector } from "@/shared/components/molecules/date-quick-selector";

import { transactionFiltersStyles as styles } from "../styles/transaction-filters.styles";

export interface TransactionFiltersDateRangeProps {
  fromText: string;
  fromIso: string;
  toText: string;
  toIso: string;
  onChangeFrom: (text: string) => void;
  onChangeTo: (text: string) => void;
  onSelectFrom: (isoDate: string) => void;
  onSelectTo: (isoDate: string) => void;
}

export function TransactionFiltersDateRange({
  fromText,
  fromIso,
  toText,
  toIso,
  onChangeFrom,
  onChangeTo,
  onSelectFrom,
  onSelectTo,
}: TransactionFiltersDateRangeProps) {
  return (
    <View style={styles.dateFields}>
      <ThemedText style={styles.dateFieldLabel}>Desde</ThemedText>
      <DateQuickSelector
        text={fromText}
        valueIso={fromIso}
        accessibilityLabel="Fecha desde"
        onChangeText={onChangeFrom}
        onSelectDate={onSelectFrom}
      />

      <ThemedText style={styles.dateFieldLabel}>Hasta</ThemedText>
      <DateQuickSelector
        text={toText}
        valueIso={toIso}
        accessibilityLabel="Fecha hasta"
        onChangeText={onChangeTo}
        onSelectDate={onSelectTo}
      />
    </View>
  );
}
