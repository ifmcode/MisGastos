import { CategoryType } from "../types/category.types";

export interface DefaultCategoryDefinition {
  legacyId: string;
  name: string;
  icon: string;
  color: string;
  type: CategoryType;
}

/**
 * Defaults mirror the categories that existed before this feature. The
 * `legacyId` keeps old transactions resolvable without rewriting them.
 */
export const DEFAULT_CATEGORIES: readonly DefaultCategoryDefinition[] = [
  {
    legacyId: "food",
    name: "Comida",
    icon: "fast-food-outline",
    color: "#EF6C00",
    type: "expense",
  },
  {
    legacyId: "transport",
    name: "Transporte",
    icon: "car-outline",
    color: "#0A7EA4",
    type: "expense",
  },
  {
    legacyId: "home",
    name: "Hogar",
    icon: "home-outline",
    color: "#6A1B9A",
    type: "expense",
  },
  {
    legacyId: "shopping",
    name: "Compras",
    icon: "cart-outline",
    color: "#C62828",
    type: "expense",
  },
  {
    legacyId: "health",
    name: "Salud",
    icon: "medkit-outline",
    color: "#2E7D32",
    type: "expense",
  },
  {
    legacyId: "leisure",
    name: "Ocio",
    icon: "game-controller-outline",
    color: "#00838F",
    type: "expense",
  },
  {
    legacyId: "education",
    name: "Educación",
    icon: "school-outline",
    color: "#4E342E",
    type: "expense",
  },
  {
    legacyId: "other-expense",
    name: "Otros gastos",
    icon: "ellipsis-horizontal-circle-outline",
    color: "#455A64",
    type: "expense",
  },
  {
    legacyId: "salary",
    name: "Salario",
    icon: "cash-outline",
    color: "#2E7D32",
    type: "income",
  },
  {
    legacyId: "freelance",
    name: "Freelance",
    icon: "briefcase-outline",
    color: "#0A7EA4",
    type: "income",
  },
  {
    legacyId: "investment",
    name: "Inversiones",
    icon: "trending-up-outline",
    color: "#6A1B9A",
    type: "income",
  },
  {
    legacyId: "gift",
    name: "Regalos",
    icon: "gift-outline",
    color: "#C62828",
    type: "income",
  },
  {
    legacyId: "other-income",
    name: "Otros ingresos",
    icon: "add-circle-outline",
    color: "#455A64",
    type: "income",
  },
];

export function getDefaultCategoryDocumentId(
  ownerId: string,
  legacyId: string,
): string {
  return `${ownerId}__${legacyId}`;
}
