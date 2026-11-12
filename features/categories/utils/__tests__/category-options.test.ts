import { describe, expect, it } from "@jest/globals";

import { Category } from "../../types/category.types";
import { buildCategoryFormValues } from "../category-form-defaults";
import {
  getCategoryIconName,
  getCategoryTypeKey,
  isCategoryIcon,
  isCategoryType,
} from "../category-options";
import {
  DEFAULT_CATEGORIES,
  getDefaultCategoryDocumentId,
} from "../default-categories";

describe("category options", () => {
  it("recognizes valid icons and falls back for unknown values", () => {
    expect(isCategoryIcon("cart-outline")).toBe(true);
    expect(isCategoryIcon("not-an-icon")).toBe(false);
    expect(getCategoryIconName("not-an-icon")).toBe("receipt-outline");
  });

  it("recognizes category types and exposes labels", () => {
    expect(isCategoryType("expense")).toBe(true);
    expect(isCategoryType("income")).toBe(true);
    expect(isCategoryType("transfer")).toBe(false);
    expect(getCategoryTypeKey("income")).toBe("types.income");
  });
});

describe("default categories", () => {
  it("keeps unique legacy ids for backward compatibility", () => {
    const legacyIds = DEFAULT_CATEGORIES.map((item) => item.legacyId);

    expect(new Set(legacyIds).size).toBe(legacyIds.length);
    expect(legacyIds).toEqual(
      expect.arrayContaining(["food", "salary", "other-income"]),
    );
  });

  it("contains expense and income defaults", () => {
    expect(DEFAULT_CATEGORIES.some((item) => item.type === "expense")).toBe(
      true,
    );
    expect(DEFAULT_CATEGORIES.some((item) => item.type === "income")).toBe(
      true,
    );
  });

  it("builds deterministic document ids", () => {
    expect(getDefaultCategoryDocumentId("user-1", "food")).toBe(
      "user-1__food",
    );
  });
});

describe("buildCategoryFormValues", () => {
  it("uses the requested type for a new category", () => {
    expect(buildCategoryFormValues(null, "income")).toMatchObject({
      name: "",
      type: "income",
    });
  });

  it("copies the editable fields of an existing category", () => {
    const category: Category = {
      id: "category-1",
      name: "Ocio",
      icon: "game-controller-outline",
      color: "#00838F",
      type: "expense",
      ownerId: "user-1",
      createdAt: "2026-10-30T10:00:00.000Z",
      updatedAt: "2026-10-30T10:00:00.000Z",
    };

    expect(buildCategoryFormValues(category, "income")).toEqual({
      name: "Ocio",
      icon: "game-controller-outline",
      color: "#00838F",
      type: "expense",
    });
  });
});
