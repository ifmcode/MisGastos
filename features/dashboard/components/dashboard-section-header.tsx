import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";

import { dashboardStyles } from "../styles/dashboard.styles";

export interface DashboardSectionHeaderProps {
  title: string;
  /** Optional counter rendered on the right side. */
  count?: number;
}

export function DashboardSectionHeader({
  title,
  count,
}: DashboardSectionHeaderProps) {
  return (
    <View style={dashboardStyles.sectionHeader}>
      <ThemedText type="subtitle" style={dashboardStyles.sectionTitle}>
        {title}
      </ThemedText>
      {typeof count === "number" ? (
        <ThemedText style={dashboardStyles.sectionCount}>{count}</ThemedText>
      ) : null}
    </View>
  );
}
