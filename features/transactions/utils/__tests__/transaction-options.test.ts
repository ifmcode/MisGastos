import { describe, expect, it } from "@jest/globals";

import { Category } from "@/features/categories/types/category.types";

import {
  getCategoriesForType,
  isTransactionCategoryId,
} from "../transaction-options";

function buildCategory(overrides: Partial<Category>): Category {
  return {
    id: "category-1",
    name: "Comida",
    icon: "fast-food-outline",
    color: "#EF6C00",
    type: "expense",
    ownerId: "user-1",
    createdAt: "2026-10-30T10:00:00.000Z",
    updatedAt: "2026-10-30T10:00:00.000Z",
    ...overrides,
  };
}

describe("isTransactionCategoryId", () => {
  it("accepts document and legacy ids and rejects unknown values", () => {
    const categories = [
      buildCategory({ id: "category-1", legacyId: "food" }),
    ];

    expect(isTransactionCategoryId(categories, "category-1")).toBe(true);
    expect(isTransactionCategoryId(categories, "food")).toBe(true);
    expect(isTransactionCategoryId(categories, "missing")).toBe(false);
    expect(isTransactionCategoryId(categories, 42)).toBe(false);
    expect(isTransactionCategoryId(categories, null)).toBe(false);
  });
});

describe("getCategoriesForType", () => {
  it("keeps the stored order instead of sorting alphabetically", () => {
    const categories = [
      buildCategory({ id: "transport", name: "Transporte", sortOrder: 0 }),
      buildCategory({ id: "food", name: "Comida", sortOrder: 1 }),
      buildCategory({ id: "home", name: "Hogar", sortOrder: 2 }),
    ];

    expect(
      getCategoriesForType(categories, "expense").map(
        (category) => category.id,
      ),
    ).toEqual(["transport", "food", "home"]);
  });

  it("filters by movement type preserving that order", () => {
    const categories = [
      buildCategory({ id: "food", sortOrder: 0 }),
      buildCategory({
        id: "salary",
        name: "Nómina",
        type: "income",
        sortOrder: 1,
      }),
      buildCategory({ id: "home", sortOrder: 2 }),
    ];

    expect(
      getCategoriesForType(categories, "income").map(
        (category) => category.id,
      ),
    ).toEqual(["salary"]);
  });
});
