import {
  Category,
  CreateCategoryDto,
  UpdateCategoryDto,
} from "../types/category.types";

export interface ICategoryRepository {
  getCategories(ownerId: string): Promise<Category[]>;
  /** Resolves a category by document id or by its legacy transaction id. */
  getCategory(ownerId: string, categoryId: string): Promise<Category | null>;
  createCategory(ownerId: string, dto: CreateCategoryDto): Promise<Category>;
  updateCategory(
    ownerId: string,
    categoryId: string,
    dto: UpdateCategoryDto,
  ): Promise<Category>;
  deleteCategory(ownerId: string, categoryId: string): Promise<void>;
  seedDefaultCategories(ownerId: string): Promise<Category[]>;
  countTransactionsUsingCategory(
    ownerId: string,
    categoryId: string,
    legacyId?: string,
  ): Promise<number>;
}
