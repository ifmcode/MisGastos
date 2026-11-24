import { describe, expect, it } from "@jest/globals";

import { Category } from "@/features/categories/types/category.types";

import { resolveCategoryForTypeChange } from "../transaction-form-category";

function buildCategory(overrides: Partial<Category>): Category {
  return {
    id: "category-1",
    name: "Comida",
    icon: "fast-food-outline",
    color: "#EF6C00",
    type: "expense",
    ownerId: "user-1",
    revision: 0,
    createdAt: "2026-10-30T10:00:00.000Z",
    updatedAt: "2026-10-30T10:00:00.000Z",
    ...overrides,
  };
}

const categories = [
  buildCategory({ id: "expense-1" }),
  buildCategory({ id: "income-1", type: "income", name: "Salario" }),
  buildCategory({ id: "legacy-income", type: "income", legacyId: "salary" }),
];

describe("resolveCategoryForTypeChange", () => {
  it("keeps a category that matches the new type", () => {
    expect(resolveCategoryForTypeChange("income-1", categories, "income")).toBe(
      "income-1",
    );
    expect(resolveCategoryForTypeChange("salary", categories, "income")).toBe(
      "salary",
    );
  });

  it("clears a category of the previous type", () => {
    expect(resolveCategoryForTypeChange("expense-1", categories, "income")).toBe(
      "",
    );
    expect(resolveCategoryForTypeChange("income-1", categories, "expense")).toBe(
      "",
    );
  });

  it("clears an unknown id and keeps the empty state empty", () => {
    expect(resolveCategoryForTypeChange("missing", categories, "income")).toBe(
      "",
    );
    expect(resolveCategoryForTypeChange("", categories, "income")).toBe("");
  });
});
