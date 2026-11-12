import { ScrollView } from "react-native";

import { categoriesStyles } from "../styles/categories.styles";
import { CategoryType } from "../types/category.types";
import { CategoriesTypeFilterChip } from "./categories-type-filter-chip";

const TYPE_FILTER_OPTIONS: readonly {
  value: CategoryType;
  label: string;
  accessibilityLabel: string;
}[] = [
  {
    value: "expense",
    label: "Gastos",
    accessibilityLabel: "Ver categorías de gasto",
  },
  {
    value: "income",
    label: "Ingresos",
    accessibilityLabel: "Ver categorías de ingreso",
  },
];

export interface CategoriesTypeFilterProps {
  selected: CategoryType;
  onSelect: (filter: CategoryType) => void;
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
