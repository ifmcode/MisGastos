import { Category, CategoryFormValues, CategoryType } from "../types/category.types";
import { DEFAULT_CATEGORY_FORM_VALUES } from "./category-options";

/** Builds form values for a new category or an existing one. */
export function buildCategoryFormValues(
  category: Category | null,
  defaultType: CategoryType,
): CategoryFormValues {
  if (category) {
    return {
      name: category.name,
      icon: category.icon,
      color: category.color,
      type: category.type,
    };
  }

  return {
    ...DEFAULT_CATEGORY_FORM_VALUES,
    type: defaultType,
  };
}
