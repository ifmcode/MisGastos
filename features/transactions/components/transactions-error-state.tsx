import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";

import {
  transactionsPalette,
  transactionsStyles as styles,
} from "../styles/transactions.styles";

export interface TransactionsErrorStateProps {
  message: string;
  onRetry: () => void;
}

export function TransactionsErrorState({
  message,
  onRetry,
}: TransactionsErrorStateProps) {
  return (
    <View style={styles.centered}>
      <Ionicons
        name="cloud-offline-outline"
        size={42}
        color={transactionsPalette.danger}
      />
      <ThemedText type="defaultSemiBold" style={styles.errorTitle}>
        No se pudieron cargar los movimientos
      </ThemedText>
      <ThemedText style={styles.centeredText}>{message}</ThemedText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Reintentar carga de movimientos"
        onPress={onRetry}
        style={styles.retryButton}
      >
        <ThemedText style={styles.retryButtonText}>Reintentar</ThemedText>
      </Pressable>
    </View>
  );
}
