import { ICategoryRepository } from "@/features/categories/repositories/category.repository";
import {
  Category,
  CreateCategoryDto,
  UpdateCategoryDto,
} from "@/features/categories/types/category.types";

import { ITransactionRepository } from "../../repositories/transaction.repository";
import {
  CreateTransactionDto,
  Transaction,
  UpdateTransactionDto,
} from "../../types/transaction.types";
import { categories, buildTransaction } from "./transaction-service.fixtures";

export class FakeCategoryRepository implements ICategoryRepository {
  async getCategories(): Promise<Category[]> {
    return categories;
  }

  async getCategory(
    _ownerId: string,
    categoryId: string,
  ): Promise<Category | null> {
    return (
      categories.find(
        (category) =>
          category.id === categoryId || category.legacyId === categoryId,
      ) ?? null
    );
  }

  async createCategory(
    _ownerId: string,
    _dto: CreateCategoryDto,
  ): Promise<Category> {
    throw new Error("not used");
  }

  async updateCategory(
    _ownerId: string,
    _categoryId: string,
    _dto: UpdateCategoryDto,
  ): Promise<Category> {
    throw new Error("not used");
  }

  async deleteCategory(): Promise<void> {
    throw new Error("not used");
  }

  async updateCategoryOrders(): Promise<void> {
    throw new Error("not used");
  }

  async seedDefaultCategories(): Promise<Category[]> {
    return categories;
  }

  async countTransactionsUsingCategory(): Promise<number> {
    return 0;
  }
}

export class FakeTransactionRepository implements ITransactionRepository {
  createCalls: CreateTransactionDto[] = [];
  updateCalls: Array<{ id: string; dto: UpdateTransactionDto }> = [];
  deleteCalls: string[] = [];
  getCalls: string[] = [];

  async getTransactions(ownerId: string): Promise<Transaction[]> {
    this.getCalls.push(ownerId);
    return [];
  }

  async createTransaction(_ownerId: string, dto: CreateTransactionDto) {
    this.createCalls.push(dto);
    return { transaction: buildTransaction(), wallets: [] };
  }

  async updateTransaction(
    _ownerId: string,
    transactionId: string,
    dto: UpdateTransactionDto,
  ) {
    this.updateCalls.push({ id: transactionId, dto });
    return {
      transaction: buildTransaction({ id: transactionId }),
      wallets: [],
    };
  }

  async deleteTransaction(_ownerId: string, transactionId: string) {
    this.deleteCalls.push(transactionId);
    return { transaction: buildTransaction(), wallets: [] };
  }
}
