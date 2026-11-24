import {
  Category,
  CreateCategoryDto,
  UpdateCategoryDto,
} from "../types/category.types";
import { CategoryOrderUpdate } from "../utils/category-order";
import { ICategoryRepository } from "./category.repository";
import { cacheCategories } from "./local-category.cache";

/**
 * Read-through category repository. Every method delegates to the remote
 * implementation; only the list read mirrors the result into SQLite, and a
 * cache failure never fails the online read.
 */
export class CachedCategoryRepository implements ICategoryRepository {
  constructor(private readonly remote: ICategoryRepository) {}

  async getCategories(ownerId: string): Promise<Category[]> {
    const categories = await this.remote.getCategories(ownerId);

    try {
      await cacheCategories(ownerId, categories, new Date().toISOString());
    } catch {
      // Best effort: the online read already succeeded.
    }

    return categories;
  }

  getCategory(
    ownerId: string,
    categoryId: string,
  ): Promise<Category | null> {
    return this.remote.getCategory(ownerId, categoryId);
  }

  createCategory(
    ownerId: string,
    dto: CreateCategoryDto,
  ): Promise<Category> {
    return this.remote.createCategory(ownerId, dto);
  }

  ensureCategory(
    ownerId: string,
    categoryId: string,
    dto: CreateCategoryDto,
  ): Promise<Category> {
    return this.remote.ensureCategory(ownerId, categoryId, dto);
  }

  updateCategory(
    ownerId: string,
    categoryId: string,
    dto: UpdateCategoryDto,
  ): Promise<Category> {
    return this.remote.updateCategory(ownerId, categoryId, dto);
  }

  updateCategoryOrders(
    ownerId: string,
    updates: readonly CategoryOrderUpdate[],
  ): Promise<void> {
    return this.remote.updateCategoryOrders(ownerId, updates);
  }

  deleteCategory(ownerId: string, categoryId: string): Promise<void> {
    return this.remote.deleteCategory(ownerId, categoryId);
  }

  seedDefaultCategories(ownerId: string): Promise<Category[]> {
    return this.remote.seedDefaultCategories(ownerId);
  }

  countTransactionsUsingCategory(
    ownerId: string,
    categoryId: string,
    legacyId?: string,
  ): Promise<number> {
    return this.remote.countTransactionsUsingCategory(
      ownerId,
      categoryId,
      legacyId,
    );
  }
}
