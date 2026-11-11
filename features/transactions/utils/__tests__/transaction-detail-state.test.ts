import { describe, expect, it } from "@jest/globals";

import { Transaction } from "../../types/transaction.types";
import {
  findTransactionForDetail,
  INITIAL_TRANSACTION_DETAIL_STATE,
  transactionDetailReducer,
} from "../transaction-detail-state";

function buildTransaction(overrides: Partial<Transaction>): Transaction {
  return {
    id: "transaction-1",
    type: "expense",
    amount: 25.5,
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

describe("transactionDetailReducer", () => {
  it("opens the detail view with the selected movement", () => {
    expect(
      transactionDetailReducer(INITIAL_TRANSACTION_DETAIL_STATE, {
        type: "open",
        transactionId: "transaction-1",
      }),
    ).toEqual({ selectedId: "transaction-1" });
  });

  it("replaces the selected movement when another one is opened", () => {
    expect(
      transactionDetailReducer(
        { selectedId: "transaction-1" },
        { type: "open", transactionId: "transaction-2" },
      ),
    ).toEqual({ selectedId: "transaction-2" });
  });

  it("closes the detail view", () => {
    expect(
      transactionDetailReducer(
        { selectedId: "transaction-1" },
        { type: "close" },
      ),
    ).toEqual(INITIAL_TRANSACTION_DETAIL_STATE);
  });
});

describe("findTransactionForDetail", () => {
  const transactions = [
    buildTransaction({ id: "transaction-1" }),
    buildTransaction({ id: "transaction-2" }),
  ];

  it("returns the selected movement from the live collection", () => {
    expect(findTransactionForDetail(transactions, "transaction-2")?.id).toBe(
      "transaction-2",
    );
  });

  it("returns null when no movement is selected", () => {
    expect(findTransactionForDetail(transactions, null)).toBeNull();
  });

  it("returns null when the movement no longer exists", () => {
    expect(findTransactionForDetail(transactions, "deleted")).toBeNull();
  });
});
