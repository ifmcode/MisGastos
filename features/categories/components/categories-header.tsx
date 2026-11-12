import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import {
  categoriesPalette,
  categoriesStyles,
} from "../styles/categories.styles";

export interface CategoriesHeaderProps {
  showAddButton: boolean;
  onAddPress: () => void;
  onBack: () => void;
}

export function CategoriesHeader({
  showAddButton,
  onAddPress,
  onBack,
}: CategoriesHeaderProps) {
  const theme = useFormTheme();
  const { t } = useTranslation(["categories", "common"]);

  return (
    <View style={categoriesStyles.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("common:accessibility.back")}
        onPress={onBack}
        style={categoriesStyles.backButton}
      >
        <Ionicons name="chevron-back" size={24} color={theme.text} />
      </Pressable>

      <View style={categoriesStyles.headerText}>
        <ThemedText type="title" style={categoriesStyles.title}>
          {t("title")}
        </ThemedText>
        <ThemedText style={categoriesStyles.subtitle}>
          {t("subtitle")}
        </ThemedText>
      </View>

      {showAddButton ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("add")}
          onPress={onAddPress}
          style={categoriesStyles.headerButton}
        >
          <Ionicons
            name="add"
            size={20}
            color={categoriesPalette.onPrimary}
          />
          <ThemedText style={categoriesStyles.headerButtonText}>
            {t("new")}
          </ThemedText>
        </Pressable>
      ) : null}
    </View>
  );
}
