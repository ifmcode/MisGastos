import { Ionicons } from "@expo/vector-icons";
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

  return (
    <View style={categoriesStyles.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Volver"
        onPress={onBack}
        style={categoriesStyles.backButton}
      >
        <Ionicons name="chevron-back" size={24} color={theme.text} />
      </Pressable>

      <View style={categoriesStyles.headerText}>
        <ThemedText type="title" style={categoriesStyles.title}>
          Categorías
        </ThemedText>
        <ThemedText style={categoriesStyles.subtitle}>
          Organiza tus gastos e ingresos.
        </ThemedText>
      </View>

      {showAddButton ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Añadir categoría"
          onPress={onAddPress}
          style={categoriesStyles.headerButton}
        >
          <Ionicons
            name="add"
            size={20}
            color={categoriesPalette.onPrimary}
          />
          <ThemedText style={categoriesStyles.headerButtonText}>
            Nueva
          </ThemedText>
        </Pressable>
      ) : null}
    </View>
  );
}
