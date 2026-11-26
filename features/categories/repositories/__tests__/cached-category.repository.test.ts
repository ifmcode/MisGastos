import { beforeEach, describe, expect, it, jest } from "@jest/globals";

jest.mock("../local-category.cache", () => ({
  cacheCategories: jest.fn(),
  readCachedCategories: jest.fn(),
}));

import {
  cacheCategories,
  readCachedCategories,
} from "../local-category.cache";
import { CachedCategoryRepository } from "../cached-category.repository";
import { ICategoryRepository } from "../category.repository";
import { buildCategory } from "./local-category.fixtures";

const cacheMock = jest.mocked(cacheCategories);
const readCachedMock = jest.mocked(readCachedCategories);

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

  describe("getCategory fallback", () => {
    it("resolves by document id from the cached list when the remote fails", async () => {
      const category = buildCategory({ id: "category-1" });
      const error = new Error("offline");
      remote.getCategory.mockRejectedValue(error);
      readCachedMock.mockResolvedValue([category]);

      await expect(
        repository.getCategory("owner-1", "category-1"),
      ).resolves.toBe(category);
    });

    it("resolves by legacy id from the cached list", async () => {
      const category = buildCategory({ legacyId: "legacy-1" });
      remote.getCategory.mockRejectedValue(new Error("offline"));
      readCachedMock.mockResolvedValue([category]);

      await expect(
        repository.getCategory("owner-1", "legacy-1"),
      ).resolves.toBe(category);
    });

    it("rethrows the original error when the cached list does not contain it", async () => {
      const error = new Error("offline");
      remote.getCategory.mockRejectedValue(error);
      readCachedMock.mockResolvedValue([
        buildCategory({ id: "other", legacyId: "other-legacy" }),
      ]);

      await expect(
        repository.getCategory("owner-1", "category-1"),
      ).rejects.toBe(error);
    });

    it("rethrows the original error when there is no cached list", async () => {
      const error = new Error("offline");
      remote.getCategory.mockRejectedValue(error);
      readCachedMock.mockResolvedValue(null);

      await expect(
        repository.getCategory("owner-1", "category-1"),
      ).rejects.toBe(error);
    });
  });
});
