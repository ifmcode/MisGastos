import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";

import { dashboardStyles } from "../styles/dashboard.styles";

export interface DashboardHeaderProps {
  greeting: string;
}

export function DashboardHeader({ greeting }: DashboardHeaderProps) {
  const { t } = useTranslation("dashboard");

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
          {t("subtitle")}
        </ThemedText>
      </View>
    </View>
  );
}
