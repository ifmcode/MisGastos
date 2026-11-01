import { describe, expect, it } from "@jest/globals";

import { CategoryOperationError } from "../category.errors";
import {
  buildCategory,
  captureError,
  createService,
  validInput,
} from "./category-service.fixtures";

describe("CategoryService.updateCategory", () => {
  it("rejects type changes and unknown categories", async () => {
    const { repository, service } = createService();
    repository.categories = [buildCategory()];

    const typeError = await captureError(
      service.updateCategory("user-1", "category-1", {
        ...validInput,
        type: "income",
      }),
    );
    const missingError = await captureError(
      service.updateCategory("user-1", "missing", validInput),
    );

    expect(typeError).toBeInstanceOf(CategoryOperationError);
    expect((typeError as CategoryOperationError).code).toBe(
      "CATEGORY_TYPE_LOCKED",
    );
    expect((missingError as CategoryOperationError).code).toBe(
      "CATEGORY_NOT_FOUND",
    );
  });

  it("updates only the editable fields", async () => {
    const { repository, service } = createService();
    repository.categories = [buildCategory()];

    await service.updateCategory("user-1", "category-1", validInput);

    expect(repository.updateCalls).toEqual([
      { name: "Restaurantes", icon: "fast-food-outline", color: "#EF6C00" },
    ]);
  });
});

describe("CategoryService.deleteCategory", () => {
  it("blocks deletion when transactions use the category", async () => {
    const { repository, service } = createService();
    repository.categories = [buildCategory()];
    repository.usage = 2;

    const error = await captureError(
      service.deleteCategory("user-1", "category-1"),
    );

    expect(error).toBeInstanceOf(CategoryOperationError);
    expect((error as CategoryOperationError).code).toBe("CATEGORY_IN_USE");
    expect(repository.deleteCalls).toEqual([]);
  });

  it("deletes unused categories and rejects unknown ids", async () => {
    const { repository, service } = createService();
    repository.categories = [buildCategory()];

    await service.deleteCategory("user-1", "category-1");
    const error = await captureError(
      service.deleteCategory("user-1", "category-1"),
    );

    expect(repository.deleteCalls).toEqual(["category-1"]);
    expect((error as CategoryOperationError).code).toBe("CATEGORY_NOT_FOUND");
  });
});
