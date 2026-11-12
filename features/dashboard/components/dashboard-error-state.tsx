import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { dashboardStyles } from "../styles/dashboard.styles";

export interface DashboardErrorStateProps {
  message: string;
  onRetry: () => void;
}

export function DashboardErrorState({
  message,
  onRetry,
}: DashboardErrorStateProps) {
  const theme = useFormTheme();
  const { t } = useTranslation(["dashboard", "common"]);

  return (
    <View style={dashboardStyles.centered}>
      <Ionicons
        name="cloud-offline-outline"
        size={42}
        color={theme.danger}
      />
      <ThemedText type="defaultSemiBold" style={dashboardStyles.errorTitle}>
        {t("errorTitle")}
      </ThemedText>
      <ThemedText style={dashboardStyles.centeredText}>{message}</ThemedText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("retryAccessibility")}
        onPress={onRetry}
        style={dashboardStyles.retryButton}
      >
        <ThemedText style={dashboardStyles.retryButtonText}>
          {t("common:actions.retry")}
        </ThemedText>
      </Pressable>
    </View>
  );
}
