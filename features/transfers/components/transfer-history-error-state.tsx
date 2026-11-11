import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { transferHistoryStyles as styles } from "../styles/transfer-history.styles";

export interface TransferHistoryErrorStateProps {
  message: string;
  onRetry: () => void;
}

export function TransferHistoryErrorState({
  message,
  onRetry,
}: TransferHistoryErrorStateProps) {
  const theme = useFormTheme();

  return (
    <View style={styles.centered}>
      <Ionicons
        name="cloud-offline-outline"
        size={42}
        color={theme.danger}
      />
      <ThemedText type="defaultSemiBold" style={styles.errorTitle}>
        No se pudieron cargar las transferencias
      </ThemedText>
      <ThemedText style={styles.centeredText}>{message}</ThemedText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Reintentar carga de transferencias"
        onPress={onRetry}
        style={styles.retryButton}
      >
        <ThemedText style={styles.retryButtonText}>Reintentar</ThemedText>
      </Pressable>
    </View>
  );
}
