import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { DateQuickSelector } from "@/shared/components/molecules/date-quick-selector";

import { transactionFiltersStyles as styles } from "../styles/transaction-filters.styles";

export interface TransactionFiltersDateRangeProps {
  fromIso: string;
  toIso: string;
  onSelectFrom: (isoDate: string) => void;
  onSelectTo: (isoDate: string) => void;
}

export function TransactionFiltersDateRange({
  fromIso,
  toIso,
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
        valueIso={fromIso}
        accessibilityLabel={t("filters.fromAccessibility")}
        onSelectDate={onSelectFrom}
      />

      <ThemedText style={styles.dateFieldLabel}>
        {t("filters.to")}
      </ThemedText>
      <DateQuickSelector
        valueIso={toIso}
        accessibilityLabel={t("filters.toAccessibility")}
        onSelectDate={onSelectTo}
      />
    </View>
  );
}
