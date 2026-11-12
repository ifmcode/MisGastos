import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { categoriesStyles } from "../styles/categories.styles";
import { Category } from "../types/category.types";
import {
  getCategoryIconName,
  getCategoryTypeLabel,
} from "../utils/category-options";
import { CategoryReorderActions } from "./category-reorder-actions";

export interface CategoryReorderControls {
  canMoveUp: boolean;
  canMoveDown: boolean;
  disabled: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

export interface CategoryCardProps {
  category: Category;
  /** Omitted in reorder mode, where tapping the card does nothing. */
  onPress?: () => void;
  reorder?: CategoryReorderControls;
}

export function CategoryCard({
  category,
  onPress,
  reorder,
}: CategoryCardProps) {
  const theme = useFormTheme();

  const content = (
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

      {reorder ? (
        <CategoryReorderActions
          categoryName={category.name}
          canMoveUp={reorder.canMoveUp}
          canMoveDown={reorder.canMoveDown}
          disabled={reorder.disabled}
          onMoveUp={reorder.onMoveUp}
          onMoveDown={reorder.onMoveDown}
        />
      ) : null}
    </ThemedView>
  );

  if (!onPress) return <View>{content}</View>;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Editar ${category.name}`}
      onPress={onPress}
    >
      {content}
    </Pressable>
  );
}
