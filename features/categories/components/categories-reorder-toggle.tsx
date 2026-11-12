import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Pressable } from "react-native";

import { ThemedText } from "@/components/themed-text";

import {
  categoriesPalette,
  categoriesStyles as styles,
} from "../styles/categories.styles";

export interface CategoriesReorderToggleProps {
  reordering: boolean;
  saving: boolean;
  onPress: () => void;
}

export function CategoriesReorderToggle({
  reordering,
  saving,
  onPress,
}: CategoriesReorderToggleProps) {
  const { t } = useTranslation("categories");

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        reordering ? t("reorder.finishAccessibility") : t("reorder.startAccessibility")
      }
      accessibilityState={{ disabled: saving, selected: reordering }}
      disabled={saving}
      onPress={onPress}
      style={[
        styles.reorderToggle,
        reordering && styles.reorderToggleActive,
        saving && styles.reorderToggleDisabled,
      ]}
    >
      <Ionicons
        name={reordering ? "checkmark" : "swap-vertical"}
        size={16}
        color={
          reordering
            ? categoriesPalette.onPrimary
            : categoriesPalette.primary
        }
      />
      <ThemedText
        style={[
          styles.reorderToggleText,
          reordering && styles.reorderToggleTextActive,
        ]}
      >
        {reordering ? t("reorder.finish") : t("reorder.start")}
      </ThemedText>
    </Pressable>
  );
}
