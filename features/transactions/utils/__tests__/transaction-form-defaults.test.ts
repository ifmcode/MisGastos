import { beforeEach, describe, expect, it } from "@jest/globals";

import { Category } from "@/features/categories/types/category.types";
import { Wallet } from "@/features/wallets/types/wallet.types";
import { getTodayIsoDate } from "@/shared/utils/date";
import {
  rememberLastUsedDate,
  resetLastUsedDate,
} from "@/shared/utils/last-used-date-store";

import { Transaction } from "../../types/transaction.types";
import { buildTransactionFormValues } from "../transaction-form-defaults";

function buildTransaction(overrides: Partial<Transaction>): Transaction {
  return {
    id: "transaction-1",
    type: "expense",
    amount: 10,
    currency: "EUR",
    walletId: "wallet-1",
    categoryId: "category-1",
    concept: "Cena",
    date: "2026-10-20",
    ownerId: "user-1",
    createdAt: "2026-10-20T10:00:00.000Z",
    updatedAt: "2026-10-20T10:00:00.000Z",
    ...overrides,
  };
}

function buildWallet(overrides: Partial<Wallet>): Wallet {
  return {
    id: "wallet-1",
    name: "Cuenta principal",
    currency: "EUR",
    icon: "wallet",
    color: "#0A7EA4",
    initialBalance: 0,
    balance: 0,
    type: "bank",
    includeInTotal: true,
    ownerId: "user-1",
    createdAt: "2026-10-29T10:00:00.000Z",
    updatedAt: "2026-10-29T10:00:00.000Z",
    ...overrides,
  };
}

function buildCategory(overrides: Partial<Category>): Category {
  return {
    id: "category-1",
    name: "Alimentación",
    icon: "fast-food-outline",
    color: "#0A7EA4",
    type: "expense",
    ownerId: "user-1",
    createdAt: "2026-10-29T10:00:00.000Z",
    updatedAt: "2026-10-29T10:00:00.000Z",
    ...overrides,
  };
}

describe("buildTransactionFormValues", () => {
  beforeEach(() => {
    resetLastUsedDate();
  });

  it("preselects the last used date for a new movement", () => {
    rememberLastUsedDate("2020-01-15");

    expect(buildTransactionFormValues([], null, []).date).toBe("2020-01-15");
  });

  it("keeps the date of the edited movement", () => {
    rememberLastUsedDate("2020-01-15");

    const values = buildTransactionFormValues(
      [],
      buildTransaction({ date: "2019-12-31" }),
      [],
    );

    expect(values.date).toBe("2019-12-31");
  });

  it("falls back to today when there is no session date", () => {
    expect(buildTransactionFormValues([], null, []).date).toBe(
      getTodayIsoDate(),
    );
  });

  it("prefills every field when editing a movement from its detail view", () => {
    expect(
      buildTransactionFormValues(
        [buildWallet({})],
        buildTransaction({
          type: "income",
          amount: 1500,
          walletId: "wallet-1",
          currency: "EUR",
          categoryId: "category-1",
          concept: "Nómina",
          notes: "Octubre",
          date: "2026-10-31",
        }),
        [buildCategory({ id: "category-1", type: "income" })],
      ),
    ).toEqual({
      type: "income",
      amount: "1500",
      walletId: "wallet-1",
      currency: "EUR",
      categoryId: "category-1",
      concept: "Nómina",
      notes: "Octubre",
      date: "2026-10-31",
    });
  });
});
