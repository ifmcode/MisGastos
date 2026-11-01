import { Pressable } from "react-native";

import { ThemedText } from "@/components/themed-text";

import { categoriesStyles } from "../styles/categories.styles";

export interface CategoriesTypeFilterChipProps {
  label: string;
  accessibilityLabel: string;
  selected: boolean;
  onPress: () => void;
}

export function CategoriesTypeFilterChip({
  label,
  accessibilityLabel,
  selected,
  onPress,
}: CategoriesTypeFilterChipProps) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={[
        categoriesStyles.filterChip,
        selected
          ? categoriesStyles.filterChipSelected
          : categoriesStyles.filterChipIdle,
      ]}
    >
      <ThemedText
        style={
          selected
            ? categoriesStyles.filterChipTextSelected
            : categoriesStyles.filterChipText
        }
        numberOfLines={1}
      >
        {label}
      </ThemedText>
    </Pressable>
  );
}
