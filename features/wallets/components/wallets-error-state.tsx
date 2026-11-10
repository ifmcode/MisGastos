import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { walletsStyles } from "../styles/wallets.styles";

export interface WalletsErrorStateProps {
  message: string;
  onRetry: () => void;
}

export function WalletsErrorState({ message, onRetry }: WalletsErrorStateProps) {
  const theme = useFormTheme();

  return (
    <View style={walletsStyles.centered}>
      <Ionicons
        name="cloud-offline-outline"
        size={42}
        color={theme.danger}
      />
      <ThemedText type="defaultSemiBold" style={walletsStyles.errorTitle}>
        No se pudieron cargar las carteras
      </ThemedText>
      <ThemedText style={walletsStyles.centeredText}>{message}</ThemedText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Reintentar carga de carteras"
        onPress={onRetry}
        style={walletsStyles.retryButton}
      >
        <ThemedText style={walletsStyles.retryButtonText}>Reintentar</ThemedText>
      </Pressable>
    </View>
  );
}
