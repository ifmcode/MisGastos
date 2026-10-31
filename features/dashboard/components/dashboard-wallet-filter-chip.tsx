import { Ionicons } from "@expo/vector-icons";
import { Pressable } from "react-native";

import { ThemedText } from "@/components/themed-text";

import { dashboardPalette, dashboardStyles } from "../styles/dashboard.styles";

export interface DashboardWalletFilterChipProps {
  label: string;
  selected: boolean;
  accessibilityLabel: string;
  onPress: () => void;
  /** When set, a colored dot is rendered before the label. */
  dotColor?: string;
}

export function DashboardWalletFilterChip({
  label,
  selected,
  accessibilityLabel,
  onPress,
  dotColor,
}: DashboardWalletFilterChipProps) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={[
        dashboardStyles.filterChip,
        selected
          ? dashboardStyles.filterChipSelected
          : dashboardStyles.filterChipIdle,
      ]}
    >
      {dotColor ? (
        <Ionicons
          name="ellipse"
          size={9}
          color={selected ? dashboardPalette.onPrimary : dotColor}
        />
      ) : null}
      <ThemedText
        style={
          selected
            ? dashboardStyles.filterChipTextSelected
            : dashboardStyles.filterChipText
        }
        numberOfLines={1}
      >
        {label}
      </ThemedText>
    </Pressable>
  );
}
