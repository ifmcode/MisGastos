import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";

import {
  categoriesPalette,
  categoriesStyles,
} from "../styles/categories.styles";

export interface CategoriesEmptyStateProps {
  title: string;
  message: string;
  onCreate: () => void;
}

export function CategoriesEmptyState({
  title,
  message,
  onCreate,
}: CategoriesEmptyStateProps) {
  return (
    <View style={categoriesStyles.emptyState}>
      <View style={categoriesStyles.emptyIcon}>
        <Ionicons
          name="pricetags-outline"
          size={36}
          color={categoriesPalette.primary}
        />
      </View>
      <ThemedText type="subtitle" style={categoriesStyles.emptyTitle}>
        {title}
      </ThemedText>
      <ThemedText style={categoriesStyles.centeredText}>
        {message}
      </ThemedText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Crear primera categoría"
        onPress={onCreate}
        style={categoriesStyles.createButton}
      >
        <Ionicons name="add" size={20} color={categoriesPalette.onPrimary} />
        <ThemedText style={categoriesStyles.createButtonText}>
          Crear categoría
        </ThemedText>
      </Pressable>
    </View>
  );
}
