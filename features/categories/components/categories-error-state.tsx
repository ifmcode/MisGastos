import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";

import {
  categoriesPalette,
  categoriesStyles,
} from "../styles/categories.styles";

export interface CategoriesErrorStateProps {
  message: string;
  onRetry: () => void;
}

export function CategoriesErrorState({
  message,
  onRetry,
}: CategoriesErrorStateProps) {
  return (
    <View style={categoriesStyles.centered}>
      <Ionicons
        name="cloud-offline-outline"
        size={42}
        color={categoriesPalette.danger}
      />
      <ThemedText type="defaultSemiBold" style={categoriesStyles.errorTitle}>
        No se pudieron cargar las categorías
      </ThemedText>
      <ThemedText style={categoriesStyles.centeredText}>{message}</ThemedText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Reintentar carga de categorías"
        onPress={onRetry}
        style={categoriesStyles.retryButton}
      >
        <ThemedText style={categoriesStyles.retryButtonText}>
          Reintentar
        </ThemedText>
      </Pressable>
    </View>
  );
}
