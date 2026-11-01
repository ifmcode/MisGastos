import { describe, expect, it } from "@jest/globals";

import { CategoryValidationError } from "../category.errors";
import {
  buildCategory,
  captureError,
  createService,
  validInput,
} from "./category-service.fixtures";

describe("CategoryService.getCategories", () => {
  it("seeds defaults when the owner has no categories", async () => {
    const { repository, service } = createService();

    const categories = await service.getCategories("  user-1  ");

    expect(repository.seedCalls).toBe(1);
    expect(categories).toHaveLength(1);
  });

  it("does not seed when the owner already has categories", async () => {
    const { repository, service } = createService();
    repository.categories = [buildCategory()];

    const categories = await service.getCategories("user-1");

    expect(repository.seedCalls).toBe(0);
    expect(categories).toHaveLength(1);
  });
});

describe("CategoryService.createCategory", () => {
  it("validates and normalizes the input", async () => {
    const { repository, service } = createService();

    const category = await service.createCategory("user-1", validInput);

    expect(repository.createCalls).toEqual([
      {
        name: "Restaurantes",
        icon: "fast-food-outline",
        color: "#EF6C00",
        type: "expense",
      },
    ]);
    expect(category.name).toBe("Restaurantes");
  });

  it("rejects invalid input and missing owners", async () => {
    const { repository, service } = createService();

    expect(
      await captureError(
        service.createCategory("user-1", { ...validInput, name: "" }),
      ),
    ).toBeInstanceOf(CategoryValidationError);
    expect(
      await captureError(service.createCategory("  ", validInput)),
    ).toBeInstanceOf(CategoryValidationError);
    expect(repository.createCalls).toEqual([]);
  });
});
