import { describe, expect, it } from "@jest/globals";

import {
  COMPACT_CATEGORY_LIMIT,
  getTransactionCategoryChips,
} from "../transaction-category-chips";
import { TransactionCategory } from "../transaction-options";

function buildCategory(
  overrides: Partial<TransactionCategory>,
): TransactionCategory {
  return {
    id: "category-1",
    label: "Alimentación",
    icon: "fast-food-outline",
    color: "#0A7EA4",
    type: "expense",
    ...overrides,
  };
}

const categories: readonly TransactionCategory[] = [
  buildCategory({ id: "food", label: "Alimentación" }),
  buildCategory({ id: "home", label: "Hogar" }),
  buildCategory({ id: "transport", label: "Transporte" }),
  buildCategory({ id: "leisure", label: "Ocio" }),
  buildCategory({ id: "health", label: "Salud" }),
];

describe("getTransactionCategoryChips", () => {
  it("shows at most three category chips", () => {
    const chips = getTransactionCategoryChips(categories, "food");

    expect(chips.visible).toHaveLength(COMPACT_CATEGORY_LIMIT);
    expect(chips.visible.map((category) => category.id)).toEqual([
      "food",
      "home",
      "transport",
    ]);
  });

  it("keeps the selected category visible when it is beyond the first three", () => {
    const chips = getTransactionCategoryChips(categories, "health");

    expect(chips.visible[0].id).toBe("health");
    expect(chips.visible).toHaveLength(COMPACT_CATEGORY_LIMIT);
  });

  it("reports every remaining category as hidden so the popup can list them", () => {
    const chips = getTransactionCategoryChips(categories, "home");
    const popupIds = [...chips.visible, ...chips.hidden].map(
      (category) => category.id,
    );

    expect(chips.hidden.map((category) => category.id)).toEqual([
      "leisure",
      "health",
    ]);
    expect(popupIds).toHaveLength(categories.length);
    expect(new Set(popupIds)).toEqual(
      new Set(categories.map((category) => category.id)),
    );
  });

  it("shows every category when there are fewer than three", () => {
    const chips = getTransactionCategoryChips(categories.slice(0, 2), "home");

    expect(chips.visible).toHaveLength(2);
    expect(chips.hidden).toHaveLength(0);
  });

  it("handles zero categories", () => {
    const chips = getTransactionCategoryChips([], "");

    expect(chips.visible).toHaveLength(0);
    expect(chips.hidden).toHaveLength(0);
  });

  it("keeps an inline-created category visible and selected", () => {
    const created = buildCategory({ id: "pets", label: "Mascotas" });
    const withCreated = [...categories, created];
    const chips = getTransactionCategoryChips(withCreated, created.id);

    expect(chips.visible[0].id).toBe("pets");
    expect(chips.visible).toHaveLength(COMPACT_CATEGORY_LIMIT);
    expect(chips.visible.some((category) => category.id === created.id)).toBe(
      true,
    );
  });
});
