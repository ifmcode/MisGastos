import { describe, expect, it } from "@jest/globals";

import { Category } from "../../types/category.types";
import {
  filterCategoriesByType,
  getCategoriesEmptyCopy,
} from "../category-filters";

const baseCategory: Category = {
  id: "category-1",
  name: "Comida",
  icon: "fast-food-outline",
  color: "#EF6C00",
  type: "expense",
  ownerId: "user-1",
  createdAt: "2026-10-30T10:00:00.000Z",
  updatedAt: "2026-10-30T10:00:00.000Z",
};

const categories: Category[] = [
  baseCategory,
  { ...baseCategory, id: "category-2", name: "Salario", type: "income" },
];

describe("filterCategoriesByType", () => {
  it("returns only matching types and preserves order", () => {
    expect(
      filterCategoriesByType(categories, "income").map(
        (category) => category.id,
      ),
    ).toEqual(["category-2"]);
    expect(
      filterCategoriesByType(categories, "expense").map(
        (category) => category.id,
      ),
    ).toEqual(["category-1"]);
  });

  it("does not mutate the input list", () => {
    const result = filterCategoriesByType(categories, "expense");
    result.pop();

    expect(categories).toHaveLength(2);
  });
});

describe("getCategoriesEmptyCopy", () => {
  it("asks for the first categories when there are none", () => {
    expect(getCategoriesEmptyCopy(false, "expense")).toEqual({
      titleKey: "emptyTitle",
      messageKey: "emptyMessage",
    });
  });

  it("explains when a type filter has no results", () => {
    expect(getCategoriesEmptyCopy(true, "income").titleKey).toBe(
      "emptyIncomeTitle",
    );
    expect(getCategoriesEmptyCopy(true, "expense").titleKey).toBe(
      "emptyExpenseTitle",
    );
  });
});
