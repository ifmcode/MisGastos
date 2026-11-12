import { useTranslation } from "react-i18next";
import { ScrollView } from "react-native";

import { asTranslate } from "@/shared/i18n/translate";

import { categoriesStyles } from "../styles/categories.styles";
import { CategoryType } from "../types/category.types";
import { CategoriesTypeFilterChip } from "./categories-type-filter-chip";

const TYPE_FILTER_OPTIONS: readonly {
  value: CategoryType;
  labelKey: string;
  accessibilityKey: string;
}[] = [
  {
    value: "expense",
    labelKey: "filter.expense",
    accessibilityKey: "filter.expenseAccessibility",
  },
  {
    value: "income",
    labelKey: "filter.income",
    accessibilityKey: "filter.incomeAccessibility",
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
  const { t } = useTranslation("categories");
  const tr = asTranslate(t);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={categoriesStyles.filterRow}
    >
      {TYPE_FILTER_OPTIONS.map((option) => (
        <CategoriesTypeFilterChip
          key={option.value}
          label={tr(option.labelKey)}
          accessibilityLabel={tr(option.accessibilityKey)}
          selected={selected === option.value}
          onPress={() => onSelect(option.value)}
        />
      ))}
    </ScrollView>
  );
}
