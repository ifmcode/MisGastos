import { TransactionType } from "../types/transaction.types";

export type TransactionCategoryIcon =
  | "fast-food-outline"
  | "car-outline"
  | "home-outline"
  | "cart-outline"
  | "medkit-outline"
  | "game-controller-outline"
  | "school-outline"
  | "ellipsis-horizontal-circle-outline"
  | "cash-outline"
  | "briefcase-outline"
  | "trending-up-outline"
  | "gift-outline"
  | "add-circle-outline"
  | "receipt-outline";

export interface TransactionCategory {
  id: string;
  label: string;
  icon: TransactionCategoryIcon;
  type: TransactionType;
}

/**
 * Fixed MVP categories. Custom categories will move to their own aggregate
 * later; keeping the set closed avoids invalid category ids in transactions.
 */
export const TRANSACTION_CATEGORIES: readonly TransactionCategory[] = [
  {
    id: "food",
    label: "Comida",
    icon: "fast-food-outline",
    type: "expense",
  },
  {
    id: "transport",
    label: "Transporte",
    icon: "car-outline",
    type: "expense",
  },
  { id: "home", label: "Hogar", icon: "home-outline", type: "expense" },
  {
    id: "shopping",
    label: "Compras",
    icon: "cart-outline",
    type: "expense",
  },
  { id: "health", label: "Salud", icon: "medkit-outline", type: "expense" },
  {
    id: "leisure",
    label: "Ocio",
    icon: "game-controller-outline",
    type: "expense",
  },
  {
    id: "education",
    label: "Educación",
    icon: "school-outline",
    type: "expense",
  },
  {
    id: "other-expense",
    label: "Otros gastos",
    icon: "ellipsis-horizontal-circle-outline",
    type: "expense",
  },
  {
    id: "salary",
    label: "Salario",
    icon: "cash-outline",
    type: "income",
  },
  {
    id: "freelance",
    label: "Freelance",
    icon: "briefcase-outline",
    type: "income",
  },
  {
    id: "investment",
    label: "Inversiones",
    icon: "trending-up-outline",
    type: "income",
  },
  { id: "gift", label: "Regalos", icon: "gift-outline", type: "income" },
  {
    id: "other-income",
    label: "Otros ingresos",
    icon: "add-circle-outline",
    type: "income",
  },
];

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
  type: "expense",
};

export function isTransactionType(value: unknown): value is TransactionType {
  return value === "expense" || value === "income";
}

export function isTransactionCategoryId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    TRANSACTION_CATEGORIES.some((category) => category.id === value)
  );
}

export function getTransactionCategory(
  categoryId: string | null | undefined,
): TransactionCategory {
  return (
    TRANSACTION_CATEGORIES.find((category) => category.id === categoryId) ??
    FALLBACK_CATEGORY
  );
}

export function getCategoriesForType(
  type: TransactionType,
): readonly TransactionCategory[] {
  return TRANSACTION_CATEGORIES.filter((category) => category.type === type);
}

export function getDefaultCategoryId(type: TransactionType): string {
  return getCategoriesForType(type)[0]?.id ?? FALLBACK_CATEGORY.id;
}

export function getTransactionTypeLabel(type: TransactionType): string {
  return TRANSACTION_TYPE_LABELS[type];
}
