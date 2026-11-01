import { describe, expect, it } from "@jest/globals";

import {
  CATEGORY_NAME_MAX_LENGTH,
  toCategoryFieldErrors,
  validateCategoryInput,
} from "../category.schema";

const baseInput = {
  name: "  Restaurantes  ",
  icon: "fast-food-outline",
  color: "#ef6c00",
  type: "expense",
};

describe("validateCategoryInput", () => {
  it("normalizes the name and color", () => {
    const result = validateCategoryInput(baseInput);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value).toEqual({
      name: "Restaurantes",
      icon: "fast-food-outline",
      color: "#EF6C00",
      type: "expense",
    });
  });

  it("requires a name and enforces its maximum length", () => {
    const empty = validateCategoryInput({ ...baseInput, name: "   " });
    const tooLong = validateCategoryInput({
      ...baseInput,
      name: "a".repeat(CATEGORY_NAME_MAX_LENGTH + 1),
    });

    expect(empty.ok).toBe(false);
    expect(tooLong.ok).toBe(false);
  });

  it("rejects unknown icons, colors and types", () => {
    const result = validateCategoryInput({
      ...baseInput,
      icon: "not-an-icon",
      color: "orange",
      type: "transfer",
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;

    expect(result.error.map((issue) => issue.field)).toEqual([
      "icon",
      "color",
      "type",
    ]);
  });
});

describe("toCategoryFieldErrors", () => {
  it("keeps the first message per field", () => {
    const errors = toCategoryFieldErrors([
      { field: "name", code: "NAME_REQUIRED", message: "Primero" },
      { field: "name", code: "NAME_REQUIRED", message: "Segundo" },
      { field: "color", code: "INVALID_COLOR", message: "Color" },
    ]);

    expect(errors).toEqual({ name: "Primero", color: "Color" });
  });
});
