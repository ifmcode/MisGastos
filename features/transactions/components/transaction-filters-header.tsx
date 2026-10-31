import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { transactionFiltersStyles as styles } from "../styles/transaction-filters.styles";

export interface TransactionFiltersHeaderProps {
  onClose: () => void;
}

export function TransactionFiltersHeader({
  onClose,
}: TransactionFiltersHeaderProps) {
  const theme = useFormTheme();

  return (
    <View style={styles.header}>
      <View style={styles.headerText}>
        <ThemedText type="title" style={styles.title}>
          Filtros
        </ThemedText>
        <ThemedText style={[styles.subtitle, { color: theme.muted }]}>
          Filtra y ordena tu historial.
        </ThemedText>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Cerrar filtros"
        hitSlop={10}
        onPress={onClose}
        style={styles.closeButton}
      >
        <Ionicons name="close" size={24} color={theme.muted} />
      </Pressable>
    </View>
  );
}
