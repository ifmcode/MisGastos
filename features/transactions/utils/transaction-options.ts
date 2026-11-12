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
  labelKey?: string;
  icon: TransactionCategoryIcon;
  color: string;
  type: TransactionType;
  legacyId?: string;
}

export function isTransactionType(value: unknown): value is TransactionType {
  return value === "expense" || value === "income";
}

export const TRANSACTION_TYPE_KEYS: Record<TransactionType, string> = {
  expense: "types.expense",
  income: "types.income",
};

export const TRANSACTION_TYPE_OPTIONS: ReadonlyArray<{
  value: TransactionType;
  labelKey: string;
}> = [
  { value: "expense", labelKey: TRANSACTION_TYPE_KEYS.expense },
  { value: "income", labelKey: TRANSACTION_TYPE_KEYS.income },
];

export const FALLBACK_CATEGORY: TransactionCategory = {
  id: "unknown",
  label: "",
  labelKey: "fallbackCategory",
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

/** Resolves user data or the translated fallback label. */
export function getTransactionCategoryLabel(
  category: TransactionCategory,
  t: (key: string) => string,
): string {
  return category.labelKey ? t(category.labelKey) : category.label;
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

export function getTransactionTypeKey(type: TransactionType): string {
  return TRANSACTION_TYPE_KEYS[type];
}
