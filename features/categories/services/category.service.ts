import { ICategoryRepository } from "../repositories/category.repository";
import {
  CategoryInput,
  CategoryValidationIssue,
  validateCategoryInput,
} from "../schemas/category.schema";
import {
  Category,
  CreateCategoryDto,
  UpdateCategoryDto,
} from "../types/category.types";
import {
  CategoryOperationError,
  CategoryValidationError,
} from "./category.errors";
import { applyCategoryOrder } from "../utils/category-order";

function ownerIssue(): CategoryValidationIssue {
  return {
    field: "ownerId",
    code: "OWNER_REQUIRED",
    message: "Debes iniciar sesión para gestionar tus categorías.",
  };
}

function categoryIdIssue(): CategoryValidationIssue {
  return {
    field: "categoryId",
    code: "CATEGORY_REQUIRED",
    message: "Selecciona una categoría válida.",
  };
}

export class CategoryService {
  constructor(private readonly repository: ICategoryRepository) {}

  /**
   * Loads the owner's categories. When the owner has none (new user or all
   * categories deleted), the defaults are seeded again.
   */
  async getCategories(ownerId: string): Promise<Category[]> {
    const normalizedOwnerId = this.normalizeOwner(ownerId);
    const categories = await this.repository.getCategories(normalizedOwnerId);

    if (categories.length > 0) return categories;

    return this.repository.seedDefaultCategories(normalizedOwnerId);
  }

  async createCategory(
    ownerId: string,
    input: CategoryInput,
  ): Promise<Category> {
    const normalizedOwnerId = this.normalizeOwner(ownerId);
    const dto = this.validateInput(input);
    return this.repository.createCategory(normalizedOwnerId, dto);
  }

  async updateCategory(
    ownerId: string,
    categoryId: string,
    input: CategoryInput,
  ): Promise<Category> {
    const normalizedOwnerId = this.normalizeOwner(ownerId);
    const normalizedCategoryId = this.normalizeCategoryId(categoryId);
    const dto = this.validateInput(input);
    const existing = await this.repository.getCategory(
      normalizedOwnerId,
      normalizedCategoryId,
    );

    if (!existing) throw new CategoryOperationError("CATEGORY_NOT_FOUND");
    if (existing.type !== dto.type) {
      throw new CategoryOperationError("CATEGORY_TYPE_LOCKED");
    }

    const update: UpdateCategoryDto = {
      name: dto.name,
      icon: dto.icon,
      color: dto.color,
    };

    return this.repository.updateCategory(
      normalizedOwnerId,
      existing.id,
      update,
    );
  }

  async reorderCategories(
    ownerId: string,
    orderedIds: readonly string[],
  ): Promise<void> {
    const normalizedOwnerId = this.normalizeOwner(ownerId);
    const categories = await this.repository.getCategories(normalizedOwnerId);
    if (categories.length === 0) return;

    const { changed } = applyCategoryOrder(categories, orderedIds);
    if (changed.length === 0) return;
    await this.repository.updateCategoryOrders(normalizedOwnerId, changed);
  }

  async deleteCategory(
    ownerId: string,
    categoryId: string,
  ): Promise<void> {
    const normalizedOwnerId = this.normalizeOwner(ownerId);
    const normalizedCategoryId = this.normalizeCategoryId(categoryId);
    const existing = await this.repository.getCategory(
      normalizedOwnerId,
      normalizedCategoryId,
    );

    if (!existing) throw new CategoryOperationError("CATEGORY_NOT_FOUND");

    const usageCount = await this.repository.countTransactionsUsingCategory(
      normalizedOwnerId,
      existing.id,
      existing.legacyId,
    );

    if (usageCount > 0) {
      throw new CategoryOperationError("CATEGORY_IN_USE");
    }

    await this.repository.deleteCategory(normalizedOwnerId, existing.id);
  }

  private normalizeOwner(ownerId: string): string {
    const normalizedOwnerId = ownerId.trim();
    if (normalizedOwnerId.length === 0) {
      throw new CategoryValidationError([ownerIssue()]);
    }
    return normalizedOwnerId;
  }

  private normalizeCategoryId(categoryId: string): string {
    const normalizedCategoryId = categoryId.trim();
    if (normalizedCategoryId.length === 0) {
      throw new CategoryValidationError([categoryIdIssue()]);
    }
    return normalizedCategoryId;
  }

  private validateInput(input: CategoryInput): CreateCategoryDto {
    const validation = validateCategoryInput(input);
    if (!validation.ok) throw new CategoryValidationError(validation.error);
    return validation.value;
  }
}
