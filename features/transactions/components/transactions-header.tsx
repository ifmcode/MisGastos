import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";

import {
  transactionsPalette,
  transactionsStyles as styles,
} from "../styles/transactions.styles";

export interface TransactionsHeaderProps {
  showActions: boolean;
  hasFilters: boolean;
  onOpenFilters: () => void;
  onCreate: () => void;
}

export function TransactionsHeader({
  showActions,
  hasFilters,
  onOpenFilters,
  onCreate,
}: TransactionsHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.headerText}>
        <ThemedText type="title" style={styles.title}>
          Movimientos
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Gastos, ingresos e historial.
        </ThemedText>
      </View>

      {showActions ? (
        <View style={styles.headerActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Abrir filtros"
            onPress={onOpenFilters}
            style={styles.headerIconButton}
          >
            <Ionicons
              name="options-outline"
              size={20}
              color={transactionsPalette.primary}
            />
            {hasFilters ? <View style={styles.filterDot} /> : null}
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Añadir movimiento"
            onPress={onCreate}
            style={styles.headerButton}
          >
            <Ionicons
              name="add"
              size={20}
              color={transactionsPalette.onPrimary}
            />
            <ThemedText style={styles.headerButtonText}>Nuevo</ThemedText>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
