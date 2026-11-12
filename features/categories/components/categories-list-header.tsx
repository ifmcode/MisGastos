import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";

import type { CategoryReorder } from "../hooks/use-category-reorder";
import { categoriesStyles as styles } from "../styles/categories.styles";
import { CategoryType } from "../types/category.types";
import { CategoriesReorderToggle } from "./categories-reorder-toggle";
import { CategoriesTypeFilter } from "./categories-type-filter";

export interface CategoriesListHeaderProps {
  typeFilter: CategoryType;
  onSelectFilter: (filter: CategoryType) => void;
  reorder: CategoryReorder;
}

export function CategoriesListHeader({
  typeFilter,
  onSelectFilter,
  reorder,
}: CategoriesListHeaderProps) {
  return (
    <View>
      <View style={styles.listHeaderRow}>
        <View style={styles.filterArea}>
          <CategoriesTypeFilter
            selected={typeFilter}
            onSelect={onSelectFilter}
          />
        </View>

        <CategoriesReorderToggle
          reordering={reorder.reordering}
          saving={reorder.saving}
          onPress={reorder.toggleReorder}
        />
      </View>

      {reorder.reordering ? (
        <ThemedText style={styles.reorderHint}>
          Usa las flechas para cambiar el orden.
        </ThemedText>
      ) : null}

      {reorder.error ? (
        <ThemedText style={styles.reorderError}>{reorder.error}</ThemedText>
      ) : null}
    </View>
  );
}
