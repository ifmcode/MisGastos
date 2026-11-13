import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";

import { dashboardStyles } from "../styles/dashboard.styles";

export interface DashboardSectionHeaderProps {
  title: string;
  /** Optional counter rendered on the right side. */
  count?: number;
  /** Optional action rendered instead of the counter. */
  actionLabel?: string;
  /** Screen-reader label for the action; defaults to `actionLabel`. */
  actionAccessibilityLabel?: string;
  onActionPress?: () => void;
}

export function DashboardSectionHeader({
  title,
  count,
  actionLabel,
  actionAccessibilityLabel,
  onActionPress,
}: DashboardSectionHeaderProps) {
  return (
    <View style={dashboardStyles.sectionHeader}>
      <ThemedText type="subtitle" style={dashboardStyles.sectionTitle}>
        {title}
      </ThemedText>
      {actionLabel && onActionPress ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={actionAccessibilityLabel ?? actionLabel}
          onPress={onActionPress}
          style={({ pressed }) => [
            dashboardStyles.sectionActionPressable,
            pressed && dashboardStyles.sectionActionPressed,
          ]}
        >
          <ThemedText style={dashboardStyles.sectionAction}>
            {actionLabel}
          </ThemedText>
        </Pressable>
      ) : typeof count === "number" ? (
        <ThemedText style={dashboardStyles.sectionCount}>{count}</ThemedText>
      ) : null}
    </View>
  );
}
