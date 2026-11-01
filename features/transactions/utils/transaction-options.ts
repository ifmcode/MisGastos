import { Category } from "@/features/categories/types/category.types";
import {
  CategoryIcon,
  getCategoryIconName,
} from "@/features/categories/utils/category-options";

import { TransactionType } from "../types/transaction.types";

export type TransactionCategoryIcon = CategoryIcon;

/**
 * Category shape used by transaction pickers and items. It is derived from
 * the persisted `Category` so forms never hardcode a category list.
 */
export interface TransactionCategory {
  id: string;
  label: string;
  icon: TransactionCategoryIcon;
  color: string;
  type: TransactionType;
  legacyId?: string;
}

export function isTransactionType(value: unknown): value is TransactionType {
  return value === "expense" || value === "income";
}

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  expense: "Gasto",
  income: "Ingreso",
};

export const TRANSACTION_TYPE_OPTIONS: ReadonlyArray<{
  value: TransactionType;
  label: string;
}> = [
  { value: "expense", label: "Gasto" },
  { value: "income", label: "Ingreso" },
];

export const FALLBACK_CATEGORY: TransactionCategory = {
  id: "unknown",
  label: "Sin categoría",
  icon: "receipt-outline",
  color: "#5C6B70",
  type: "expense",
};

export function toTransactionCategory(
  category: Category,
): TransactionCategory {
  return {
    id: category.id,
    label: category.name,
    icon: getCategoryIconName(category.icon),
    color: category.color,
    type: category.type,
    ...(category.legacyId ? { legacyId: category.legacyId } : {}),
  };
}

export function findTransactionCategory(
  categories: readonly Category[],
  categoryId: string | null | undefined,
): TransactionCategory | undefined {
  const category = categories.find(
    (item) => item.id === categoryId || item.legacyId === categoryId,
  );

  return category ? toTransactionCategory(category) : undefined;
}

export function getTransactionCategory(
  categories: readonly Category[],
  categoryId: string | null | undefined,
): TransactionCategory {
  return findTransactionCategory(categories, categoryId) ?? FALLBACK_CATEGORY;
}

export function getCategoriesForType(
  categories: readonly Category[],
  type: TransactionType,
): readonly TransactionCategory[] {
  return categories
    .filter((category) => category.type === type)
    .map(toTransactionCategory);
}

export function getDefaultCategoryId(
  categories: readonly Category[],
  type: TransactionType,
): string {
  return categories.find((category) => category.type === type)?.id ?? "";
}

export function isTransactionCategoryId(
  categories: readonly Category[],
  value: unknown,
): value is string {
  return (
    typeof value === "string" &&
    categories.some(
      (category) => category.id === value || category.legacyId === value,
    )
  );
}

export function getTransactionTypeLabel(type: TransactionType): string {
  return TRANSACTION_TYPE_LABELS[type];
}
