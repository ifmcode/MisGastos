import { Category } from "../../types/category.types";

export const LOCAL_TEST_OWNER = "owner-1";

export function buildCategory(overrides: Partial<Category> = {}): Category {
  return {
    id: "category-1",
    name: "Comida",
    icon: "cart-outline",
    color: "#C62828",
    type: "expense",
    ownerId: LOCAL_TEST_OWNER,
    revision: 3,
    sortOrder: 2,
    legacyId: "legacy-1",
    createdAt: "2026-10-27T10:00:00.000Z",
    updatedAt: "2026-10-27T11:00:00.000Z",
    ...overrides,
  };
}
