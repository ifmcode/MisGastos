import { Category, CategoryType } from "../types/category.types";

/** Returns the categories of one type, preserving the stored order. */
export function filterCategoriesByType(
  categories: readonly Category[],
  type: CategoryType,
): Category[] {
  return categories.filter((category) => category.type === type);
}

export interface CategoriesEmptyCopy {
  title: string;
  message: string;
}

/** Copy shown when the list is empty, either globally or for one type. */
export function getCategoriesEmptyCopy(
  hasCategories: boolean,
  typeFilter: CategoryType,
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
