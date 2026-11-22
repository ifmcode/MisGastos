import { Category } from "@/features/categories/types/category.types";

import { TransactionType } from "../types/transaction.types";
import { findTransactionCategory } from "./transaction-options";

/**
 * Category kept when the movement type changes. Only a category that already
 * matches the new type survives; anything else is cleared, so the user always
 * chooses the new category explicitly instead of receiving a silent default.
 */
export function resolveCategoryForTypeChange(
  categoryId: string,
  categories: readonly Category[],
  type: TransactionType,
): string {
  if (categoryId.length === 0) return "";

  const category = findTransactionCategory(categories, categoryId);

  return category && category.type === type ? categoryId : "";
}
