import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";

import { transactionsStyles as styles } from "../styles/transactions.styles";

export interface TransactionsActiveFiltersHeaderProps {
  resultCount: number;
  activeFilterCount: number;
  onClearFilters: () => void;
}

export function TransactionsActiveFiltersHeader({
  resultCount,
  activeFilterCount,
  onClearFilters,
}: TransactionsActiveFiltersHeaderProps) {
  const { t } = useTranslation(["transactions", "common"]);

  return (
    <View style={styles.activeFiltersRow}>
      <ThemedText style={styles.activeFiltersText}>
        {t("common:units.results", { count: resultCount })} ·{" "}
        {t("common:units.filters", { count: activeFilterCount })}
      </ThemedText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("filters.clearAccessibility")}
        onPress={onClearFilters}
      >
        <ThemedText style={styles.clearFiltersText}>
          {t("filters.clear")}
        </ThemedText>
      </Pressable>
    </View>
  );
}
