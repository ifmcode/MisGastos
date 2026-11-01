import { CategoryFormValues, CategoryType } from "../types/category.types";

/** Closed icon set so categories always render a valid Ionicons glyph. */
export const CATEGORY_ICONS = [
  "fast-food-outline",
  "car-outline",
  "home-outline",
  "cart-outline",
  "medkit-outline",
  "game-controller-outline",
  "school-outline",
  "ellipsis-horizontal-circle-outline",
  "cash-outline",
  "briefcase-outline",
  "trending-up-outline",
  "gift-outline",
  "add-circle-outline",
  "receipt-outline",
  "airplane-outline",
  "paw-outline",
  "fitness-outline",
  "cafe-outline",
] as const;

export type CategoryIcon = (typeof CATEGORY_ICONS)[number];

export const CATEGORY_COLORS = [
  "#0A7EA4",
  "#2E7D32",
  "#C62828",
  "#6A1B9A",
  "#EF6C00",
  "#00838F",
  "#4E342E",
  "#455A64",
  "#AD1457",
  "#5D4037",
] as const;

export type CategoryColor = (typeof CATEGORY_COLORS)[number];

export const CATEGORY_TYPE_LABELS: Record<CategoryType, string> = {
  expense: "Gasto",
  income: "Ingreso",
};

export const CATEGORY_TYPE_OPTIONS: ReadonlyArray<{
  value: CategoryType;
  label: string;
  icon: CategoryIcon;
}> = [
  { value: "expense", label: "Gasto", icon: "cart-outline" },
  { value: "income", label: "Ingreso", icon: "cash-outline" },
];

export const DEFAULT_CATEGORY_FORM_VALUES: CategoryFormValues = {
  name: "",
  icon: "receipt-outline",
  color: CATEGORY_COLORS[0],
  type: "expense",
};

export function isCategoryIcon(value: unknown): value is CategoryIcon {
  return (
    typeof value === "string" &&
    (CATEGORY_ICONS as readonly string[]).includes(value)
  );
}

export function isCategoryType(value: unknown): value is CategoryType {
  return value === "expense" || value === "income";
}

export function getCategoryIconName(value: string): CategoryIcon {
  return isCategoryIcon(value) ? value : "receipt-outline";
}

export function getCategoryTypeLabel(type: CategoryType): string {
  return CATEGORY_TYPE_LABELS[type];
}
