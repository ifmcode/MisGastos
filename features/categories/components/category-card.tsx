import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { asTranslate } from "@/shared/i18n/translate";

import { categoriesStyles } from "../styles/categories.styles";
import { Category } from "../types/category.types";
import {
  getCategoryIconName,
  getCategoryTypeKey,
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
  const { t } = useTranslation("categories");
  const tr = asTranslate(t);

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
          {tr(getCategoryTypeKey(category.type))}
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
      accessibilityLabel={t("editAccessibility", { name: category.name })}
      onPress={onPress}
    >
      {content}
    </Pressable>
  );
}
