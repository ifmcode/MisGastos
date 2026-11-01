import { Ionicons } from "@expo/vector-icons";
import { Pressable } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useColorScheme } from "@/hooks/use-color-scheme";

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
  const colorScheme = useColorScheme() ?? "light";
  const borderColor = colorScheme === "dark" ? "#2B3438" : "#E4ECEF";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Editar ${category.name}`}
      onPress={onPress}
    >
      <ThemedView
        style={[categoriesStyles.card, { borderColor }]}
        lightColor="#FFFFFF"
        darkColor="#1C2225"
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
