import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { transactionFiltersStyles as styles } from "../styles/transaction-filters.styles";

export interface TransactionFiltersActionsProps {
  onReset: () => void;
  onApply: () => void;
}

export function TransactionFiltersActions({
  onReset,
  onApply,
}: TransactionFiltersActionsProps) {
  const theme = useFormTheme();

  return (
    <View style={styles.actions}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Restablecer filtros"
        onPress={onReset}
        style={[
          styles.secondaryButton,
          { borderColor: theme.border, backgroundColor: theme.surface },
        ]}
      >
        <ThemedText type="defaultSemiBold">Restablecer</ThemedText>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Aplicar filtros"
        onPress={onApply}
        style={styles.primaryButton}
      >
        <ThemedText style={styles.primaryButtonText}>Aplicar</ThemedText>
      </Pressable>
    </View>
  );
}
