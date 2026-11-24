import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import { CachedCategoryRepository } from "../cached-category.repository";
import { ICategoryRepository } from "../category.repository";
import {
  CreateCategoryDto,
  UpdateCategoryDto,
} from "../../types/category.types";
import { buildCategory } from "./local-category.fixtures";

function createRemote(): jest.Mocked<ICategoryRepository> {
  return {
    getCategories: jest.fn(),
    getCategory: jest.fn(),
    createCategory: jest.fn(),
    ensureCategory: jest.fn(),
    updateCategory: jest.fn(),
    updateCategoryOrders: jest.fn(),
    deleteCategory: jest.fn(),
    seedDefaultCategories: jest.fn(),
    countTransactionsUsingCategory: jest.fn(),
  };
}

const dto: CreateCategoryDto = {
  name: "Comida",
  icon: "cart-outline",
  color: "#C62828",
  type: "expense",
};
const update: UpdateCategoryDto = {
  name: "Comida",
  icon: "cart-outline",
  color: "#C62828",
};

describe("CachedCategoryRepository delegation", () => {
  let remote: jest.Mocked<ICategoryRepository>;
  let repository: CachedCategoryRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    remote = createRemote();
    repository = new CachedCategoryRepository(remote);
  });

  it("delegates getCategory", async () => {
    const category = buildCategory();
    remote.getCategory.mockResolvedValue(category);

    await expect(
      repository.getCategory("owner-1", "category-1"),
    ).resolves.toBe(category);
    expect(remote.getCategory).toHaveBeenCalledWith("owner-1", "category-1");
  });

  it("delegates createCategory", async () => {
    const category = buildCategory();
    remote.createCategory.mockResolvedValue(category);

    await expect(repository.createCategory("owner-1", dto)).resolves.toBe(
      category,
    );
    expect(remote.createCategory).toHaveBeenCalledWith("owner-1", dto);
  });

  it("delegates ensureCategory", async () => {
    const category = buildCategory();
    remote.ensureCategory.mockResolvedValue(category);

    await expect(
      repository.ensureCategory("owner-1", "category-1", dto),
    ).resolves.toBe(category);
    expect(remote.ensureCategory).toHaveBeenCalledWith(
      "owner-1",
      "category-1",
      dto,
    );
  });

  it("delegates updateCategory", async () => {
    const category = buildCategory();
    remote.updateCategory.mockResolvedValue(category);

    await expect(
      repository.updateCategory("owner-1", "category-1", update),
    ).resolves.toBe(category);
    expect(remote.updateCategory).toHaveBeenCalledWith(
      "owner-1",
      "category-1",
      update,
    );
  });

  it("delegates updateCategoryOrders", async () => {
    const updates = [{ id: "category-1", sortOrder: 0 }];
    remote.updateCategoryOrders.mockResolvedValue(undefined);

    await expect(
      repository.updateCategoryOrders("owner-1", updates),
    ).resolves.toBeUndefined();
    expect(remote.updateCategoryOrders).toHaveBeenCalledWith(
      "owner-1",
      updates,
    );
  });

  it("delegates deleteCategory", async () => {
    remote.deleteCategory.mockResolvedValue(undefined);

    await expect(
      repository.deleteCategory("owner-1", "category-1"),
    ).resolves.toBeUndefined();
    expect(remote.deleteCategory).toHaveBeenCalledWith(
      "owner-1",
      "category-1",
    );
  });

  it("delegates seedDefaultCategories", async () => {
    const categories = [buildCategory()];
    remote.seedDefaultCategories.mockResolvedValue(categories);

    await expect(
      repository.seedDefaultCategories("owner-1"),
    ).resolves.toBe(categories);
    expect(remote.seedDefaultCategories).toHaveBeenCalledWith("owner-1");
  });

  it("delegates countTransactionsUsingCategory", async () => {
    remote.countTransactionsUsingCategory.mockResolvedValue(3);

    await expect(
      repository.countTransactionsUsingCategory("owner-1", "category-1"),
    ).resolves.toBe(3);
    expect(remote.countTransactionsUsingCategory).toHaveBeenCalledWith(
      "owner-1",
      "category-1",
      undefined,
    );
  });
});
