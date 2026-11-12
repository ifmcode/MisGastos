import { Category } from "@/features/categories/types/category.types";

import {
  findTransactionCategory,
  isTransactionType,
} from "../utils/transaction-options";
import {
  TransactionInput,
  TransactionValidationIssue,
} from "./transaction-validation.types";

/** Validates that the selected category exists and matches the movement type. */
export function getTransactionCategoryIssue(
  input: TransactionInput,
  categories?: readonly Category[],
): TransactionValidationIssue | null {
  const categoryId =
    typeof input.categoryId === "string" ? input.categoryId.trim() : "";

  if (categoryId.length === 0) {
    return { field: "categoryId", code: "INVALID_CATEGORY" };
  }

  if (!categories) return null;

  const category = findTransactionCategory(categories, categoryId);

  if (!category) {
    return { field: "categoryId", code: "INVALID_CATEGORY" };
  }

  if (isTransactionType(input.type) && category.type !== input.type) {
    return { field: "categoryId", code: "CATEGORY_TYPE_MISMATCH" };
  }

  return null;
}
