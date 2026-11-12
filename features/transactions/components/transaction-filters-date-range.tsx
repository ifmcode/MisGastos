import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation("transactions");

  return (
    <View style={styles.dateFields}>
      <ThemedText style={styles.dateFieldLabel}>
        {t("filters.from")}
      </ThemedText>
      <DateQuickSelector
        text={fromText}
        valueIso={fromIso}
        accessibilityLabel={t("filters.fromAccessibility")}
        onChangeText={onChangeFrom}
        onSelectDate={onSelectFrom}
      />

      <ThemedText style={styles.dateFieldLabel}>
        {t("filters.to")}
      </ThemedText>
      <DateQuickSelector
        text={toText}
        valueIso={toIso}
        accessibilityLabel={t("filters.toAccessibility")}
        onChangeText={onChangeTo}
        onSelectDate={onSelectTo}
      />
    </View>
  );
}
