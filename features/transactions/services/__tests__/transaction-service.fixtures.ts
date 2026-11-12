import { ICategoryRepository } from "@/features/categories/repositories/category.repository";
import { Category } from "@/features/categories/types/category.types";

import { Transaction } from "../../types/transaction.types";
import { TransactionService } from "../transaction.service";
import {
  FakeCategoryRepository,
  FakeTransactionRepository,
} from "./transaction-service.fakes";

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

export const expenseCategory = categories[0];

export function createService() {
  const repository = new FakeTransactionRepository();
  const categoryRepository = new FakeCategoryRepository();
  const service = new TransactionService(repository, categoryRepository);

  return { repository, service };
}

/** Builds a service whose category lookup returns the given category. */
export function createServiceWithCategory(category: Category | null) {
  const repository = new FakeTransactionRepository();
  const categoryRepository = {
    getCategory: async () => category,
  } as unknown as ICategoryRepository;
  const service = new TransactionService(repository, categoryRepository);

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
