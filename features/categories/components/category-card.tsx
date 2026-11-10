import { Ionicons } from "@expo/vector-icons";
import { Pressable } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { categoriesStyles } from "../styles/categories.styles";
import { Category } from "../types/category.types";
import {
  getCategoryIconName,
  getCategoryTypeLabel,
} from "../utils/category-options";

export interface CategoryCardProps {
  category: Category;
  onPress: () => void;
}

export function CategoryCard({ category, onPress }: CategoryCardProps) {
  const theme = useFormTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Editar ${category.name}`}
      onPress={onPress}
    >
      <ThemedView
        style={[
          categoriesStyles.card,
          { borderColor: theme.border, backgroundColor: theme.surface },
        ]}
      >
        <ThemedView
          style={[
            categoriesStyles.iconWrapper,
            { backgroundColor: `${category.color}1A` },
          ]}
        >
          <Ionicons
            name={getCategoryIconName(category.icon)}
            size={22}
            color={category.color}
          />
        </ThemedView>

        <ThemedView style={categoriesStyles.cardDetails}>
          <ThemedText type="defaultSemiBold" numberOfLines={1}>
            {category.name}
          </ThemedText>
          <ThemedText style={categoriesStyles.cardMeta} numberOfLines={1}>
            {getCategoryTypeLabel(category.type)}
          </ThemedText>
        </ThemedView>
      </ThemedView>
    </Pressable>
  );
}
