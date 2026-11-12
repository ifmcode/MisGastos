import { useTranslation } from "react-i18next";
import { ActivityIndicator, View } from "react-native";

import { ThemedText } from "@/components/themed-text";

import { dashboardPalette, dashboardStyles } from "../styles/dashboard.styles";

export interface DashboardLoadingStateProps {
  message?: string;
}

export function DashboardLoadingState({
  message,
}: DashboardLoadingStateProps) {
  const { t } = useTranslation("dashboard");

  return (
    <View style={dashboardStyles.centered}>
      <ActivityIndicator size="large" color={dashboardPalette.primary} />
      <ThemedText style={dashboardStyles.centeredText}>
        {message ?? t("loadingSummary")}
      </ThemedText>
    </View>
  );
}
