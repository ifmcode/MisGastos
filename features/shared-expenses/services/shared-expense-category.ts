import type { ICategoryRepository } from "@/features/categories/repositories/category.repository";
import type { CreateCategoryDto } from "@/features/categories/types/category.types";
import { getDefaultCategoryDocumentId } from "@/features/categories/utils/default-categories";

/** Suffix of the deterministic id; it is not part of `DEFAULT_CATEGORIES`. */
export const SHARED_EXPENSE_CATEGORY_ID = "shared-expense";

/** Created on demand for a payer's linked movement, never seeded for everyone. */
export const SHARED_EXPENSE_CATEGORY: CreateCategoryDto = {
  name: "Gastos compartidos",
  icon: "people-outline",
  color: "#0A7EA4",
  type: "expense",
};

export function getSharedExpenseCategoryId(ownerId: string): string {
  return getDefaultCategoryDocumentId(ownerId, SHARED_EXPENSE_CATEGORY_ID);
}

/**
 * Returns the shared-expense category id, creating the document only when it is
 * missing. The deterministic id resolves concurrent creates and an existing —
 * even renamed — category is never rewritten.
 */
export async function ensureSharedExpenseCategory(
  categoryRepository: ICategoryRepository,
  ownerId: string,
): Promise<string> {
  const categoryId = getSharedExpenseCategoryId(ownerId);
  const existing = await categoryRepository.getCategory(ownerId, categoryId);

  if (existing) return existing.id;

  await categoryRepository.ensureCategory(
    ownerId,
    categoryId,
    SHARED_EXPENSE_CATEGORY,
  );

  return categoryId;
}
