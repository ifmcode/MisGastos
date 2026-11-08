import { Category } from "../types/category.types";

export interface DeleteCategoryConfirmation {
  title: string;
  message: string;
}

/** Builds the copy shown before deleting a category. */
export function getDeleteCategoryConfirmation(
  category: Category,
): DeleteCategoryConfirmation {
  return {
    title: "Eliminar categoría",
    message: `¿Seguro que quieres eliminar "${category.name}"? Solo es posible si no se usa en ningún movimiento.`,
  };
}
