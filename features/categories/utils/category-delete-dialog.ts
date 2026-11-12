import { Category } from "../types/category.types";

export interface DeleteCategoryConfirmation {
  titleKey: string;
  messageKey: string;
  values: { name: string };
}

/** Builds the translation keys shown before deleting a category. */
export function getDeleteCategoryConfirmation(
  category: Category,
): DeleteCategoryConfirmation {
  return {
    titleKey: "deleteDialog.title",
    messageKey: "deleteDialog.message",
    values: { name: category.name },
  };
}
