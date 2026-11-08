import { describe, expect, it } from "@jest/globals";

import { Category } from "../../types/category.types";
import { getDeleteCategoryConfirmation } from "../category-delete-dialog";

function buildCategory(overrides: Partial<Category>): Category {
  return {
    id: "category-1",
    name: "Comida",
    icon: "restaurant",
    color: "#0A7EA4",
    type: "expense",
    ownerId: "user-1",
    createdAt: "2026-10-20T10:00:00.000Z",
    updatedAt: "2026-10-20T10:00:00.000Z",
    ...overrides,
  };
}

describe("getDeleteCategoryConfirmation", () => {
  it("includes the category name and the usage warning", () => {
    const confirmation = getDeleteCategoryConfirmation(buildCategory({}));

    expect(confirmation).toEqual({
      title: "Eliminar categoría",
      message:
        '¿Seguro que quieres eliminar "Comida"? Solo es posible si no se usa en ningún movimiento.',
    });
  });
});
