import { beforeEach, describe, expect, it } from "@jest/globals";

import {
  buildTransaction,
  readStoredGroupExpenseId,
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
      deletedAt: null,
    });
  });

  it("keeps an explicit soft-delete stamp from the DTO", () => {
    const data = toTransactionData(
      "user-1",
      { ...validDto, deletedAt: "2026-11-16T10:00:00.000Z" },
      "now",
    );

    expect(data.deletedAt).toBe("2026-11-16T10:00:00.000Z");
  });

  it("persists a shared expense link only on expense movements", () => {
    const linked = toTransactionData(
      "user-1",
      { ...validDto, sharedExpenseId: "  expense-1  " },
      "now",
    );
    const income = toTransactionData(
      "user-1",
      { ...validDto, type: "income", sharedExpenseId: "expense-1" },
      "now",
    );

    expect(linked.sharedExpenseId).toBe("expense-1");
    expect(income).not.toHaveProperty("sharedExpenseId");
  });

  it("omits empty notes", () => {
    const data = toTransactionData("user-1", { ...validDto, notes: "   " }, "now");

    expect(data).not.toHaveProperty("notes");
  });

  it("persists a settlement link only on income movements", () => {
    const linked = toTransactionData(
      "user-1",
      { ...validDto, type: "income", settlementId: "  settlement-1  " },
      "now",
    );
    const expense = toTransactionData(
      "user-1",
      { ...validDto, settlementId: "settlement-1" },
      "now",
    );

    expect(linked.settlementId).toBe("settlement-1");
    expect(expense).not.toHaveProperty("settlementId");
  });

  it("persists a group settlement link only on income movements", () => {
    const linked = toTransactionData(
      "user-1",
      { ...validDto, type: "income", groupSettlementId: "  group-settlement-1  " },
      "now",
    );
    const expense = toTransactionData(
      "user-1",
      { ...validDto, groupSettlementId: "group-settlement-1" },
      "now",
    );

    expect(linked.groupSettlementId).toBe("group-settlement-1");
    expect(linked).not.toHaveProperty("settlementId");
    expect(expense).not.toHaveProperty("groupSettlementId");
  });

  it("never mixes the two link keys", () => {
    const income = toTransactionData(
      "user-1",
      {
        ...validDto,
        type: "income",
        sharedExpenseId: "expense-1",
        settlementId: "settlement-1",
      },
      "now",
    );

    expect(income).not.toHaveProperty("sharedExpenseId");
    expect(income.settlementId).toBe("settlement-1");
  });

  it("persists a group expense link only on expense movements", () => {
    const linked = toTransactionData(
      "user-1",
      { ...validDto, groupExpenseId: "  group-expense-1  " },
      "now",
    );
    const income = toTransactionData(
      "user-1",
      { ...validDto, type: "income", groupExpenseId: "group-expense-1" },
      "now",
    );

    expect(linked.groupExpenseId).toBe("group-expense-1");
    expect(income).not.toHaveProperty("groupExpenseId");
    expect(
      toTransactionData("user-1", { ...validDto, groupExpenseId: "  " }, "now"),
    ).not.toHaveProperty("groupExpenseId");
  });
});

describe("readStoredGroupExpenseId", () => {
  it("trims the stored link and ignores a blank or missing one", () => {
    expect(readStoredGroupExpenseId({ groupExpenseId: " group-1 " })).toBe(
      "group-1",
    );
    expect(readStoredGroupExpenseId({ groupExpenseId: "  " })).toBeUndefined();
    expect(readStoredGroupExpenseId({})).toBeUndefined();
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
        deletedAt: null,
      },
    );
  });

  it("keeps the shared expense id only on expense movements", () => {
    const expense = buildTransaction(
      "transaction-1",
      "user-1",
      { ...validDto, sharedExpenseId: "expense-1" },
      "now",
    );
    const income = buildTransaction(
      "transaction-1",
      "user-1",
      { ...validDto, type: "income", sharedExpenseId: "expense-1" },
      "now",
    );

    expect(expense.sharedExpenseId).toBe("expense-1");
    expect(income).not.toHaveProperty("sharedExpenseId");
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

  it("keeps the settlement id only on income movements", () => {
    const income = buildTransaction(
      "transaction-1",
      "user-1",
      { ...validDto, type: "income", settlementId: "settlement-1" },
      "now",
    );
    const expense = buildTransaction(
      "transaction-1",
      "user-1",
      { ...validDto, settlementId: "settlement-1" },
      "now",
    );

    expect(income.settlementId).toBe("settlement-1");
    expect(expense).not.toHaveProperty("settlementId");
  });

  it("keeps the group settlement id only on income movements", () => {
    const income = buildTransaction(
      "transaction-1",
      "user-1",
      { ...validDto, type: "income", groupSettlementId: "group-settlement-1" },
      "now",
    );
    const expense = buildTransaction(
      "transaction-1",
      "user-1",
      { ...validDto, groupSettlementId: "group-settlement-1" },
      "now",
    );

    expect(income.groupSettlementId).toBe("group-settlement-1");
    expect(expense).not.toHaveProperty("groupSettlementId");
  });

  it("keeps the group expense id only on expense movements", () => {
    const expense = buildTransaction(
      "transaction-1",
      "user-1",
      { ...validDto, groupExpenseId: "group-expense-1" },
      "now",
    );
    const income = buildTransaction(
      "transaction-1",
      "user-1",
      { ...validDto, type: "income", groupExpenseId: "group-expense-1" },
      "now",
    );

    expect(expense.groupExpenseId).toBe("group-expense-1");
    expect(income).not.toHaveProperty("groupExpenseId");
  });
});
