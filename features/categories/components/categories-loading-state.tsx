import { useTranslation } from "react-i18next";
import { ActivityIndicator, View } from "react-native";

import { ThemedText } from "@/components/themed-text";

import {
  categoriesPalette,
  categoriesStyles,
} from "../styles/categories.styles";

export function CategoriesLoadingState() {
  const { t } = useTranslation("categories");

  return (
    <View style={categoriesStyles.centered}>
      <ActivityIndicator size="large" color={categoriesPalette.primary} />
      <ThemedText style={categoriesStyles.centeredText}>
        {t("loading")}
      </ThemedText>
    </View>
  );
}
