import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { transactionDetailStyles as styles } from "../styles/transaction-detail.styles";

export interface TransactionDetailMissingStateProps {
  onClose: () => void;
}

/** Shown when the selected movement disappeared from the live collection. */
export function TransactionDetailMissingState({
  onClose,
}: TransactionDetailMissingStateProps) {
  const theme = useFormTheme();

  return (
    <View style={styles.missingContainer}>
      <View style={styles.missingIcon}>
        <Ionicons name="document-outline" size={30} color={theme.primary} />
      </View>
      <ThemedText type="defaultSemiBold" style={styles.missingTitle}>
        Movimiento no disponible
      </ThemedText>
      <ThemedText style={[styles.missingMessage, { color: theme.muted }]}>
        Este movimiento ya no existe o se eliminó desde otro dispositivo.
      </ThemedText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Cerrar detalle"
        onPress={onClose}
        style={styles.missingButton}
      >
        <ThemedText style={styles.missingButtonText}>Cerrar</ThemedText>
      </Pressable>
    </View>
  );
}
