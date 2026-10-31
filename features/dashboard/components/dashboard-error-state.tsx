import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";

import { dashboardPalette, dashboardStyles } from "../styles/dashboard.styles";

export interface DashboardErrorStateProps {
  message: string;
  onRetry: () => void;
}

export function DashboardErrorState({
  message,
  onRetry,
}: DashboardErrorStateProps) {
  return (
    <View style={dashboardStyles.centered}>
      <Ionicons
        name="cloud-offline-outline"
        size={42}
        color={dashboardPalette.danger}
      />
      <ThemedText type="defaultSemiBold" style={dashboardStyles.errorTitle}>
        No se pudo cargar el resumen
      </ThemedText>
      <ThemedText style={dashboardStyles.centeredText}>{message}</ThemedText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Reintentar carga del resumen"
        onPress={onRetry}
        style={dashboardStyles.retryButton}
      >
        <ThemedText style={dashboardStyles.retryButtonText}>
          Reintentar
        </ThemedText>
      </Pressable>
    </View>
  );
}
