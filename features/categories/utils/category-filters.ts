import { Category, CategoryTypeFilter } from "../types/category.types";

/** Returns the categories matching a type filter, preserving list order. */
export function filterCategoriesByType(
  categories: readonly Category[],
  typeFilter: CategoryTypeFilter,
): Category[] {
  if (typeFilter === "all") return [...categories];

  return categories.filter((category) => category.type === typeFilter);
}

export interface CategoriesEmptyCopy {
  title: string;
  message: string;
}

/** Copy shown when the list is empty, either globally or for one filter. */
export function getCategoriesEmptyCopy(
  hasCategories: boolean,
  typeFilter: CategoryTypeFilter,
): CategoriesEmptyCopy {
  if (!hasCategories) {
    return {
      title: "Aún no tienes categorías",
      message: "Crea categorías para clasificar tus gastos e ingresos.",
    };
  }

  if (typeFilter === "income") {
    return {
      title: "No hay categorías de ingreso",
      message: "Crea una categoría de ingreso o cambia el filtro.",
    };
  }

  return {
    title: "No hay categorías de gasto",
    message: "Crea una categoría de gasto o cambia el filtro.",
  };
}
