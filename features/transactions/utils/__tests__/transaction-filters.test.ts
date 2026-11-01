import { describe, expect, it } from "@jest/globals";

import { Category } from "@/features/categories/types/category.types";

import { Transaction } from "../../types/transaction.types";
import {
  countActiveFilters,
  DEFAULT_TRANSACTION_FILTERS,
  filterTransactions,
} from "../transaction-filters";

const categories: Category[] = [
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

function buildTransaction(overrides: Partial<Transaction> = {}): Transaction {
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

describe("filterTransactions category ids", () => {
  it("matches legacy transaction ids when the new category id is selected", () => {
    const transactions = [
      buildTransaction({ id: "old", categoryId: "food" }),
      buildTransaction({ id: "new", categoryId: "user-1__food" }),
      buildTransaction({ id: "other", categoryId: "user-1__transport" }),
    ];

    const result = filterTransactions(
      transactions,
      { ...DEFAULT_TRANSACTION_FILTERS, categoryId: "user-1__food" },
      categories,
    );

    expect(result.map((item) => item.id)).toEqual(["old", "new"]);
  });

  it("matches new category ids when the legacy id is selected", () => {
    const result = filterTransactions(
      [buildTransaction()],
      { ...DEFAULT_TRANSACTION_FILTERS, categoryId: "food" },
      categories,
    );

    expect(result).toHaveLength(1);
  });

  it("keeps exact matching when no category metadata is provided", () => {
    const transactions = [
      buildTransaction({ id: "old", categoryId: "food" }),
      buildTransaction({ id: "new", categoryId: "user-1__food" }),
    ];

    const result = filterTransactions(transactions, {
      ...DEFAULT_TRANSACTION_FILTERS,
      categoryId: "food",
    });

    expect(result.map((item) => item.id)).toEqual(["old"]);
  });
});

describe("countActiveFilters", () => {
  it("counts category and other active filters", () => {
    expect(
      countActiveFilters({
        ...DEFAULT_TRANSACTION_FILTERS,
        categoryId: "food",
        type: "income",
      }),
    ).toBe(2);
  });
});
