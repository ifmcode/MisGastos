import { useTranslation } from "react-i18next";
import { FlatList, View } from "react-native";

import { EmptyState } from "@/shared/components/molecules/empty-state";
import { asTranslate } from "@/shared/i18n/translate";

import type { CategoryReorder } from "../hooks/use-category-reorder";
import { categoriesStyles as styles } from "../styles/categories.styles";
import { Category, CategoryType } from "../types/category.types";
import { getCategoriesEmptyCopy } from "../utils/category-filters";
import { CategoriesListHeader } from "./categories-list-header";
import { CategoryCard } from "./category-card";

export interface CategoriesListProps {
  categories: Category[];
  visibleCategories: Category[];
  typeFilter: CategoryType;
  refreshing: boolean;
  reorder: CategoryReorder;
  onSelectFilter: (filter: CategoryType) => void;
  onSelectCategory: (category: Category) => void;
  onCreateCategory: () => void;
  onRefresh: () => void;
}

function CategorySeparator() {
  return <View style={styles.separator} />;
}

export function CategoriesList({
  categories,
  visibleCategories,
  typeFilter,
  refreshing,
  reorder,
  onSelectFilter,
  onSelectCategory,
  onCreateCategory,
  onRefresh,
}: CategoriesListProps) {
  const { t } = useTranslation("categories");
  const tr = asTranslate(t);
  const emptyCopy = getCategoriesEmptyCopy(
    categories.length > 0,
    typeFilter,
  );

  return (
    <FlatList
      data={visibleCategories}
      keyExtractor={(category) => category.id}
      renderItem={({ item, index }) => (
        <CategoryCard
          category={item}
          onPress={
            reorder.reordering ? undefined : () => onSelectCategory(item)
          }
          reorder={
            reorder.reordering
              ? {
                  canMoveUp: index > 0,
                  canMoveDown: index < visibleCategories.length - 1,
                  disabled: reorder.saving,
                  onMoveUp: () => reorder.move(item.id, "up"),
                  onMoveDown: () => reorder.move(item.id, "down"),
                }
              : undefined
          }
        />
      )}
      ItemSeparatorComponent={CategorySeparator}
      ListHeaderComponent={
        categories.length > 0 ? (
          <CategoriesListHeader
            typeFilter={typeFilter}
            onSelectFilter={onSelectFilter}
            reorder={reorder}
          />
        ) : undefined
      }
      ListEmptyComponent={
        <EmptyState
          icon="pricetags-outline"
          title={tr(emptyCopy.titleKey)}
          message={tr(emptyCopy.messageKey)}
          primaryAction={{
            label: t("create"),
            accessibilityLabel: t("createFirst"),
            onPress: onCreateCategory,
            icon: "add",
          }}
        />
      }
      contentContainerStyle={[
        styles.listContent,
        categories.length === 0 && styles.emptyListContent,
      ]}
      refreshing={refreshing}
      onRefresh={onRefresh}
      showsVerticalScrollIndicator={false}
    />
  );
}
