import { ScrollView } from "react-native";

import { categoriesStyles } from "../styles/categories.styles";
import { CategoryTypeFilter } from "../types/category.types";
import { CategoriesTypeFilterChip } from "./categories-type-filter-chip";

const TYPE_FILTER_OPTIONS: ReadonlyArray<{
  value: CategoryTypeFilter;
  label: string;
  accessibilityLabel: string;
}> = [
  {
    value: "all",
    label: "Todas",
    accessibilityLabel: "Todas las categorías",
  },
  {
    value: "expense",
    label: "Gastos",
    accessibilityLabel: "Filtrar categorías de gasto",
  },
  {
    value: "income",
    label: "Ingresos",
    accessibilityLabel: "Filtrar categorías de ingreso",
  },
];

export interface CategoriesTypeFilterProps {
  selected: CategoryTypeFilter;
  onSelect: (filter: CategoryTypeFilter) => void;
}

export function CategoriesTypeFilter({
  selected,
  onSelect,
}: CategoriesTypeFilterProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={categoriesStyles.filterRow}
    >
      {TYPE_FILTER_OPTIONS.map((option) => (
        <CategoriesTypeFilterChip
          key={option.value}
          label={option.label}
          accessibilityLabel={option.accessibilityLabel}
          selected={selected === option.value}
          onPress={() => onSelect(option.value)}
        />
      ))}
    </ScrollView>
  );
}
