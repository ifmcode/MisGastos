import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";

import { dashboardPalette, dashboardStyles } from "../styles/dashboard.styles";

export interface DashboardHeaderProps {
  greeting: string;
  showTransferButton: boolean;
  onTransferPress: () => void;
}

export function DashboardHeader({
  greeting,
  showTransferButton,
  onTransferPress,
}: DashboardHeaderProps) {
  return (
    <View style={dashboardStyles.header}>
      <View style={dashboardStyles.headerText}>
        <ThemedText
          type="title"
          style={dashboardStyles.title}
          numberOfLines={1}
        >
          {greeting}
        </ThemedText>
        <ThemedText style={dashboardStyles.subtitle}>
          Este es el resumen de tus finanzas.
        </ThemedText>
      </View>

      {showTransferButton ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Nueva transferencia"
          onPress={onTransferPress}
          style={dashboardStyles.headerButton}
        >
          <Ionicons
            name="swap-horizontal"
            size={20}
            color={dashboardPalette.onPrimary}
          />
          <ThemedText style={dashboardStyles.headerButtonText}>
            Transferir
          </ThemedText>
        </Pressable>
      ) : null}
    </View>
  );
}
