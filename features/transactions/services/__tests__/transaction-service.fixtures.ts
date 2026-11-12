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
import { TransactionService } from "../transaction.service";

export const categories: Category[] = [
  {
    id: "user-1__food",
    legacyId: "food",
    name: "Comida",
    icon: "fast-food-outline",
    color: "#EF6C00",
    type: "expense",
    ownerId: "user-1",
    createdAt: "2026-10-30T10:00:00.000Z",
    updatedAt: "2026-10-30T10:00:00.000Z",
  },
];

export function buildTransaction(
  overrides: Partial<Transaction> = {},
): Transaction {
  return {
    id: "transaction-1",
    type: "expense",
    amount: 10,
    currency: "EUR",
    walletId: "wallet-1",
    categoryId: "user-1__food",
    concept: "Cena",
    date: "2026-10-30",
    ownerId: "user-1",
    createdAt: "2026-10-30T20:00:00.000Z",
    updatedAt: "2026-10-30T20:00:00.000Z",
    ...overrides,
  };
}

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

  async getTransactions(): Promise<Transaction[]> {
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

  async deleteTransaction() {
    return { transaction: buildTransaction(), wallets: [] };
  }
}

export function createService() {
  const repository = new FakeTransactionRepository();
  const categoryRepository = new FakeCategoryRepository();
  const service = new TransactionService(repository, categoryRepository);

  return { repository, service };
}

export const validInput = {
  type: "expense",
  amount: "10,50",
  currency: "EUR",
  walletId: "wallet-1",
  categoryId: "user-1__food",
  concept: "Cena",
  notes: "",
  date: "30/10/2026",
};

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
