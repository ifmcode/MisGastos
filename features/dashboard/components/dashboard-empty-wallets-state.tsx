import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";

import { dashboardPalette, dashboardStyles } from "../styles/dashboard.styles";

export function DashboardEmptyWalletsState() {
  return (
    <View style={dashboardStyles.emptyState}>
      <View style={dashboardStyles.emptyIcon}>
        <Ionicons
          name="wallet-outline"
          size={36}
          color={dashboardPalette.primary}
        />
      </View>
      <ThemedText type="subtitle" style={dashboardStyles.emptyTitle}>
        Aún no tienes carteras
      </ThemedText>
      <ThemedText style={dashboardStyles.centeredText}>
        Crea tu primera cartera en la pestaña Carteras para empezar a ver tu
        saldo y hacer transferencias.
      </ThemedText>
    </View>
  );
}
