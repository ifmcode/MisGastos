import type { ICategoryRepository } from "@/features/categories/repositories/category.repository";
import type {
  Category,
  CreateCategoryDto,
  UpdateCategoryDto,
} from "@/features/categories/types/category.types";

import type {
  ISharedExpensesRepository,
  ISharedExpenseLinkRepository,
} from "../../repositories/shared-expenses.repository";
import type {
  CreateSharedExpenseDto,
  SharedExpense,
  UpdateSharedExpenseDto,
} from "../../types/shared-expense.types";
import { SharedExpenseOperationError } from "../shared-expense.errors";

/** In-memory repository: the service tests never touch Firestore. */
export class FakeSharedExpensesRepository
  implements ISharedExpensesRepository
{
  readonly expenses = new Map<string, SharedExpense>();
  readonly createCalls: CreateSharedExpenseDto[] = [];
  readonly updateCalls: Array<{
    expenseId: string;
    update: UpdateSharedExpenseDto;
  }> = [];
  readonly deleteCalls: Array<{ expenseId: string; deletedAt: string }> = [];
  failure: Error | null = null;

  seed(expense: SharedExpense): SharedExpense {
    this.expenses.set(expense.id, expense);
    return expense;
  }

  private guard(): void {
    if (this.failure) throw this.failure;
  }

  async getExpense(expenseId: string): Promise<SharedExpense | null> {
    this.guard();
    return this.expenses.get(expenseId) ?? null;
  }

  async getExpenses(viewerUid: string): Promise<SharedExpense[]> {
    this.guard();

    return Array.from(this.expenses.values()).filter((expense) =>
      expense.participantIds.includes(viewerUid),
    );
  }

  async createExpense(dto: CreateSharedExpenseDto): Promise<SharedExpense> {
    this.guard();
    this.createCalls.push(dto);

    const expense: SharedExpense = {
      id: `expense-${this.createCalls.length}`,
      ...dto,
    };
    this.expenses.set(expense.id, expense);

    return expense;
  }

  async updateExpense(
    expenseId: string,
    update: UpdateSharedExpenseDto,
  ): Promise<SharedExpense> {
    this.guard();
    this.updateCalls.push({ expenseId, update });

    const existing = this.expenses.get(expenseId);
    if (!existing) throw new SharedExpenseOperationError("EXPENSE_NOT_FOUND");

    const updated: SharedExpense = { ...existing, ...update };
    this.expenses.set(expenseId, updated);

    return updated;
  }

  async softDeleteExpense(
    expenseId: string,
    deletedAt: string,
  ): Promise<void> {
    this.guard();
    this.deleteCalls.push({ expenseId, deletedAt });

    const existing = this.expenses.get(expenseId);
    if (!existing) return;

    this.expenses.set(expenseId, { ...existing, deletedAt, updatedAt: deletedAt });
  }
}

/** Atomic-pair fake: records every call and mirrors the stored expense. */
export class FakeSharedExpenseLinkRepository
  implements ISharedExpenseLinkRepository
{
  readonly expenses = new Map<string, SharedExpense>();
  readonly createCalls: CreateSharedExpenseDto[] = [];
  readonly updateCalls: Array<{
    viewerUid: string;
    expenseId: string;
    update: UpdateSharedExpenseDto;
  }> = [];
  readonly deleteCalls: Array<{
    viewerUid: string;
    expenseId: string;
    deletedAt: string;
  }> = [];
  failure: Error | null = null;

  seed(expense: SharedExpense): SharedExpense {
    this.expenses.set(expense.id, expense);
    return expense;
  }

  private guard(): void {
    if (this.failure) throw this.failure;
  }

  async createExpenseLink(
    dto: CreateSharedExpenseDto,
  ): Promise<SharedExpense> {
    this.guard();
    this.createCalls.push(dto);

    const expense: SharedExpense = { id: "expense-link-1", ...dto };
    this.expenses.set(expense.id, expense);

    return expense;
  }

  async updateExpenseLink(
    viewerUid: string,
    expenseId: string,
    update: UpdateSharedExpenseDto,
  ): Promise<SharedExpense> {
    this.guard();
    this.updateCalls.push({ viewerUid, expenseId, update });

    const existing = this.expenses.get(expenseId);
    if (!existing) throw new SharedExpenseOperationError("EXPENSE_NOT_FOUND");

    const updated: SharedExpense = {
      ...existing,
      ...update,
      linkedTransactionId: update.walletId ? "movement-1" : null,
    };
    this.expenses.set(expenseId, updated);

    return updated;
  }

  async softDeleteExpenseLink(
    viewerUid: string,
    expenseId: string,
    deletedAt: string,
  ): Promise<void> {
    this.guard();
    this.deleteCalls.push({ viewerUid, expenseId, deletedAt });

    const existing = this.expenses.get(expenseId);
    if (!existing) return;

    this.expenses.set(expenseId, { ...existing, deletedAt, updatedAt: deletedAt });
  }
}

/** Category fake: `ensureCategory` mirrors the deterministic-id contract. */
export class FakeSharedExpenseCategoryRepository
  implements ICategoryRepository
{
  readonly categories = new Map<string, Category>();
  readonly ensureCalls: Array<{
    ownerId: string;
    categoryId: string;
    dto: CreateCategoryDto;
  }> = [];

  seed(category: Category): Category {
    this.categories.set(category.id, category);
    return category;
  }

  async getCategories(ownerId: string): Promise<Category[]> {
    return Array.from(this.categories.values()).filter(
      (category) => category.ownerId === ownerId,
    );
  }

  async getCategory(
    ownerId: string,
    categoryId: string,
  ): Promise<Category | null> {
    void ownerId;
    return this.categories.get(categoryId) ?? null;
  }

  async createCategory(
    _ownerId: string,
    _dto: CreateCategoryDto,
  ): Promise<Category> {
    throw new Error("not used");
  }

  async ensureCategory(
    ownerId: string,
    categoryId: string,
    dto: CreateCategoryDto,
  ): Promise<Category> {
    this.ensureCalls.push({ ownerId, categoryId, dto });

    const existing = this.categories.get(categoryId);
    if (existing) return existing;

    const category: Category = {
      id: categoryId,
      ownerId,
      name: dto.name,
      icon: dto.icon,
      color: dto.color,
      type: dto.type,
      revision: 0,
      createdAt: "2026-11-16T10:00:00.000Z",
      updatedAt: "2026-11-16T10:00:00.000Z",
    };
    this.categories.set(categoryId, category);

    return category;
  }

  async updateCategory(
    _ownerId: string,
    _categoryId: string,
    _dto: UpdateCategoryDto,
  ): Promise<Category> {
    throw new Error("not used");
  }

  async updateCategoryOrders(): Promise<void> {
    throw new Error("not used");
  }

  async deleteCategory(): Promise<void> {
    throw new Error("not used");
  }

  async seedDefaultCategories(): Promise<Category[]> {
    return [];
  }

  async countTransactionsUsingCategory(): Promise<number> {
    return 0;
  }
}
