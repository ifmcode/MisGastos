import { beforeEach, describe, expect, it } from "@jest/globals";

import {
  buildTransaction,
  getSignedTransactionAmount,
  getSignedTransactionAmountObj,
  toTransactionData,
  toWalletBalance,
} from "../transaction-firestore.utils";
import {
  setupTransactionRepositoryMocks,
  validDto,
} from "./transaction-repository.test-helpers";

beforeEach(setupTransactionRepositoryMocks);

describe("toWalletBalance", () => {
  it("prefers a finite stored balance", () => {
    expect(toWalletBalance({ balance: 24.5, initialBalance: 100 })).toBe(24.5);
  });

  it("falls back to the initial balance when balance is missing", () => {
    expect(toWalletBalance({ initialBalance: 100.555 })).toBe(100.56);
  });

  it("returns zero for invalid values", () => {
    expect(toWalletBalance({ balance: Number.NaN })).toBe(0);
    expect(toWalletBalance({})).toBe(0);
  });
});

describe("toTransactionData", () => {
  it("trims concept and notes and rounds the amount", () => {
    expect(toTransactionData("user-1", validDto, "now")).toEqual({
      type: "expense",
      amount: 25.5,
      currency: "EUR",
      walletId: "wallet-1",
      categoryId: "category-1",
      concept: "Supermercado",
      notes: "Compra semanal",
      date: "2026-11-12",
      ownerId: "user-1",
      createdAt: "now",
      updatedAt: "now",
    });
  });

  it("omits empty notes", () => {
    const data = toTransactionData("user-1", { ...validDto, notes: "   " }, "now");

    expect(data).not.toHaveProperty("notes");
  });
});

describe("buildTransaction", () => {
  it("builds a transaction with the trimmed fields", () => {
    expect(buildTransaction("transaction-1", "user-1", validDto, "now")).toEqual(
      {
        id: "transaction-1",
        type: "expense",
        amount: 25.5,
        currency: "EUR",
        walletId: "wallet-1",
        categoryId: "category-1",
        concept: "Supermercado",
        notes: "Compra semanal",
        date: "2026-11-12",
        ownerId: "user-1",
        createdAt: "now",
        updatedAt: "now",
      },
    );
  });

  it("omits empty notes", () => {
    const transaction = buildTransaction(
      "transaction-1",
      "user-1",
      { ...validDto, notes: "" },
      "now",
    );

    expect(transaction).not.toHaveProperty("notes");
  });
});

describe("getSignedTransactionAmount", () => {
  it("accepts a dto or a type and amount pair", () => {
    expect(getSignedTransactionAmount(validDto)).toBe(-25.5);
    expect(getSignedTransactionAmount("income", 10)).toBe(10);
    expect(getSignedTransactionAmount("expense", 10)).toBe(-10);
    expect(getSignedTransactionAmount("income")).toBe(0);
  });

  it("normalizes the signed object amount", () => {
    expect(getSignedTransactionAmountObj({ type: "income", amount: 12.345 })).toBe(
      12.35,
    );
  });
});
