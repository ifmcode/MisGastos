import { Category, CategoryType } from "../types/category.types";

/** Returns the categories of one type, preserving the stored order. */
export function filterCategoriesByType(
  categories: readonly Category[],
  type: CategoryType,
): Category[] {
  return categories.filter((category) => category.type === type);
}

export interface CategoriesEmptyCopy {
  titleKey: string;
  messageKey: string;
}

/** Copy keys shown when the list is empty, either globally or for one type. */
export function getCategoriesEmptyCopy(
  hasCategories: boolean,
  typeFilter: CategoryType,
): CategoriesEmptyCopy {
  if (!hasCategories) {
    return {
      titleKey: "emptyTitle",
      messageKey: "emptyMessage",
    };
  }

  if (typeFilter === "income") {
    return {
      titleKey: "emptyIncomeTitle",
      messageKey: "emptyIncomeMessage",
    };
  }

  return {
    titleKey: "emptyExpenseTitle",
    messageKey: "emptyExpenseMessage",
  };
}
