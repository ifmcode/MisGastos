import { beforeEach, describe, expect, it, jest } from "@jest/globals";

jest.mock("../local-category.cache", () => ({
  cacheCategories: jest.fn(),
}));

import { cacheCategories } from "../local-category.cache";
import { CachedCategoryRepository } from "../cached-category.repository";
import { ICategoryRepository } from "../category.repository";
import { buildCategory } from "./local-category.fixtures";

const cacheMock = jest.mocked(cacheCategories);

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

describe("CachedCategoryRepository list reads", () => {
  let remote: jest.Mocked<ICategoryRepository>;
  let repository: CachedCategoryRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    remote = createRemote();
    repository = new CachedCategoryRepository(remote);
  });

  it("mirrors the list read and returns the remote list", async () => {
    const categories = [buildCategory()];
    remote.getCategories.mockResolvedValue(categories);

    await expect(repository.getCategories("owner-1")).resolves.toBe(categories);

    expect(remote.getCategories).toHaveBeenCalledWith("owner-1");
    expect(cacheMock).toHaveBeenCalledWith(
      "owner-1",
      categories,
      expect.any(String),
    );
  });

  it("does not reject when the cache write fails", async () => {
    const categories = [buildCategory()];
    remote.getCategories.mockResolvedValue(categories);
    cacheMock.mockRejectedValueOnce(new Error("disk full"));

    await expect(repository.getCategories("owner-1")).resolves.toBe(categories);
  });
});
