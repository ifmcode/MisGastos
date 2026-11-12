import { describe, expect, it } from "@jest/globals";

import { Transaction } from "../../types/transaction.types";
import {
  countActiveFilters,
  DEFAULT_TRANSACTION_FILTERS,
  filterTransactions,
  sortTransactions,
} from "../transaction-filters";

function buildTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: "transaction-1",
    type: "expense",
    amount: 10,
    currency: "EUR",
    walletId: "wallet-1",
    categoryId: "category-1",
    concept: "Cena",
    date: "2026-10-30",
    ownerId: "user-1",
    createdAt: "2026-10-30T20:00:00.000Z",
    updatedAt: "2026-10-30T20:00:00.000Z",
    ...overrides,
  };
}

describe("filterTransactions", () => {
  it("filters by wallet, type and date range", () => {
    const transactions = [
      buildTransaction({ id: "match" }),
      buildTransaction({ id: "other-wallet", walletId: "wallet-2" }),
      buildTransaction({ id: "income", type: "income" }),
      buildTransaction({ id: "older", date: "2026-09-30" }),
      buildTransaction({ id: "newer", date: "2026-12-01" }),
    ];

    const result = filterTransactions(transactions, {
      ...DEFAULT_TRANSACTION_FILTERS,
      walletId: "wallet-1",
      type: "expense",
      fromDate: "01/10/2026",
      toDate: "30/11/2026",
    });

    expect(result.map((item) => item.id)).toEqual(["match"]);
  });

  it("ignores blank dates", () => {
    const transactions = [buildTransaction({ id: "one" })];

    expect(
      filterTransactions(transactions, {
        ...DEFAULT_TRANSACTION_FILTERS,
        fromDate: "   ",
        toDate: "   ",
      }),
    ).toHaveLength(1);
  });
});

describe("sortTransactions", () => {
  it("sorts by date and uses createdAt as tie-breaker", () => {
    const transactions = [
      buildTransaction({
        id: "older",
        date: "2026-10-01",
        createdAt: "2026-10-01T10:00:00.000Z",
      }),
      buildTransaction({
        id: "same-date-later",
        date: "2026-10-30",
        createdAt: "2026-10-30T20:00:00.000Z",
      }),
      buildTransaction({
        id: "same-date-earlier",
        date: "2026-10-30",
        createdAt: "2026-10-30T08:00:00.000Z",
      }),
    ];

    expect(sortTransactions(transactions, "desc").map((item) => item.id)).toEqual(
      ["same-date-later", "same-date-earlier", "older"],
    );
    expect(sortTransactions(transactions, "asc").map((item) => item.id)).toEqual(
      ["older", "same-date-earlier", "same-date-later"],
    );
  });

  it("treats invalid createdAt values as zero", () => {
    const transactions = [
      buildTransaction({ id: "invalid", createdAt: "bad" }),
      buildTransaction({ id: "valid", createdAt: "2026-10-30T08:00:00.000Z" }),
    ];

    expect(sortTransactions(transactions, "asc").map((item) => item.id)).toEqual(
      ["invalid", "valid"],
    );
  });
});

describe("countActiveFilters", () => {
  it("counts every active filter", () => {
    expect(
      countActiveFilters({
        walletId: "wallet-1",
        type: "expense",
        categoryId: "category-1",
        fromDate: "01/10/2026",
        toDate: "30/11/2026",
        sort: "asc",
      }),
    ).toBe(6);
  });

  it("ignores blank dates and the default sort", () => {
    expect(
      countActiveFilters({ ...DEFAULT_TRANSACTION_FILTERS, fromDate: "  " }),
    ).toBe(0);
  });
});
