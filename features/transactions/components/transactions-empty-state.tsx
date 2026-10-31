import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";

import {
  transactionsPalette,
  transactionsStyles as styles,
} from "../styles/transactions.styles";

export interface TransactionsEmptyStateProps {
  hasFilters: boolean;
  onCreate: () => void;
  onClearFilters: () => void;
}

export function TransactionsEmptyState({
  hasFilters,
  onCreate,
  onClearFilters,
}: TransactionsEmptyStateProps) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons
          name="receipt-outline"
          size={36}
          color={transactionsPalette.primary}
        />
      </View>
      <ThemedText type="subtitle" style={styles.emptyTitle}>
        {hasFilters ? "Sin resultados" : "Aún no tienes movimientos"}
      </ThemedText>
      <ThemedText style={styles.centeredText}>
        {hasFilters
          ? "No hay movimientos con los filtros aplicados. Prueba a cambiarlos."
          : "Registra tu primer gasto o ingreso para empezar a seguir tu saldo."}
      </ThemedText>
      {hasFilters ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Limpiar filtros"
          onPress={onClearFilters}
          style={styles.secondaryEmptyButton}
        >
          <ThemedText style={styles.secondaryEmptyButtonText}>
            Limpiar filtros
          </ThemedText>
        </Pressable>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Crear primer movimiento"
          onPress={onCreate}
          style={styles.createButton}
        >
          <Ionicons
            name="add"
            size={20}
            color={transactionsPalette.onPrimary}
          />
          <ThemedText style={styles.createButtonText}>
            Crear movimiento
          </ThemedText>
        </Pressable>
      )}
    </View>
  );
}
