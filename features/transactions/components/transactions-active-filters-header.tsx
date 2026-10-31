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
  const filterLabel = activeFilterCount === 1 ? "filtro" : "filtros";

  return (
    <View style={styles.activeFiltersRow}>
      <ThemedText style={styles.activeFiltersText}>
        {resultCount} resultados · {activeFilterCount} {filterLabel}
      </ThemedText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Limpiar filtros"
        onPress={onClearFilters}
      >
        <ThemedText style={styles.clearFiltersText}>Limpiar</ThemedText>
      </Pressable>
    </View>
  );
}
