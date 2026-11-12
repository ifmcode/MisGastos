import { ICategoryRepository } from "../../repositories/category.repository";
import {
  Category,
  CreateCategoryDto,
  UpdateCategoryDto,
} from "../../types/category.types";
import { CategoryService } from "../category.service";

export const validInput = {
  name: "  Restaurantes  ",
  icon: "fast-food-outline",
  color: "#ef6c00",
  type: "expense",
};

export function buildCategory(overrides: Partial<Category> = {}): Category {
  return {
    id: "category-1",
    name: "Restaurantes",
    icon: "fast-food-outline",
    color: "#EF6C00",
    type: "expense",
    ownerId: "user-1",
    createdAt: "2026-10-30T10:00:00.000Z",
    updatedAt: "2026-10-30T10:00:00.000Z",
    ...overrides,
  };
}

export class FakeCategoryRepository implements ICategoryRepository {
  categories: Category[] = [];
  usage = 0;
  seedCalls = 0;
  createCalls: CreateCategoryDto[] = [];
  updateCalls: UpdateCategoryDto[] = [];
  deleteCalls: string[] = [];
  orderCalls: Array<{
    ownerId: string;
    updates: Array<{ id: string; sortOrder: number }>;
  }> = [];

  async getCategories(ownerId: string): Promise<Category[]> {
    return this.categories.filter((item) => item.ownerId === ownerId);
  }

  async getCategory(
    _ownerId: string,
    categoryId: string,
  ): Promise<Category | null> {
    return (
      this.categories.find(
        (item) => item.id === categoryId || item.legacyId === categoryId,
      ) ?? null
    );
  }

  async createCategory(
    ownerId: string,
    dto: CreateCategoryDto,
  ): Promise<Category> {
    this.createCalls.push(dto);
    const category = buildCategory({ id: "category-new", ownerId, ...dto });
    this.categories.push(category);
    return category;
  }

  async updateCategory(
    ownerId: string,
    categoryId: string,
    dto: UpdateCategoryDto,
  ): Promise<Category> {
    this.updateCalls.push(dto);
    const category = buildCategory({ id: categoryId, ownerId, ...dto });
    this.categories = this.categories.map((item) =>
      item.id === categoryId ? category : item,
    );
    return category;
  }

  async deleteCategory(_ownerId: string, categoryId: string): Promise<void> {
    this.deleteCalls.push(categoryId);
    this.categories = this.categories.filter((item) => item.id !== categoryId);
  }

  async updateCategoryOrders(
    ownerId: string,
    updates: readonly { id: string; sortOrder: number }[],
  ): Promise<void> {
    this.orderCalls.push({ ownerId, updates: [...updates] });
    this.categories = this.categories.map((item) => {
      const update = updates.find((entry) => entry.id === item.id);
      return update ? { ...item, sortOrder: update.sortOrder } : item;
    });
  }

  async seedDefaultCategories(ownerId: string): Promise<Category[]> {
    this.seedCalls += 1;
    this.categories = [buildCategory({ id: "seed", ownerId })];
    return this.categories;
  }

  async countTransactionsUsingCategory(): Promise<number> {
    return this.usage;
  }
}

export function createService() {
  const repository = new FakeCategoryRepository();
  const service = new CategoryService(repository);

  return { repository, service };
}

export async function captureError(
  promise: Promise<unknown>,
): Promise<unknown> {
  try {
    await promise;
  } catch (error: unknown) {
    return error;
  }

  throw new Error("Expected promise to reject");
}
