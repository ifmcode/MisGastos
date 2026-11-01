import { ActivityIndicator, View } from "react-native";

import { ThemedText } from "@/components/themed-text";

import {
  categoriesPalette,
  categoriesStyles,
} from "../styles/categories.styles";

export function CategoriesLoadingState() {
  return (
    <View style={categoriesStyles.centered}>
      <ActivityIndicator size="large" color={categoriesPalette.primary} />
      <ThemedText style={categoriesStyles.centeredText}>
        Cargando categorías…
      </ThemedText>
    </View>
  );
}
