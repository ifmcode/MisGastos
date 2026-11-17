import { getDefaultCategoryDocumentId } from "@/features/categories/utils/default-categories";

/** Suffix of the deterministic id; it is not part of `DEFAULT_CATEGORIES`. */
export const SHARED_EXPENSE_CATEGORY_ID = "shared-expense";

/**
 * Deterministic id the picker offers and the legacy clearing compares against.
 * The category is never created implicitly: the viewer picks it in the form.
 */
export function getSharedExpenseCategoryId(ownerId: string): string {
  return getDefaultCategoryDocumentId(ownerId, SHARED_EXPENSE_CATEGORY_ID);
}
