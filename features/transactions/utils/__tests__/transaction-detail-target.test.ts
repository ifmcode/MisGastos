import { describe, expect, it } from "@jest/globals";

import type { Transaction } from "../../types/transaction.types";
import { getTransactionDetailTarget } from "../transaction-detail-target";

function buildTransaction(): Transaction {
  return {
    id: "transaction-1",
    type: "expense",
    amount: 20,
    currency: "EUR",
    walletId: "wallet-1",
    categoryId: "category-1",
    concept: "Cena",
    date: "2026-11-13",
    ownerId: "user-1",
    revision: 0,
    createdAt: "2026-11-13T10:00:00.000Z",
    updatedAt: "2026-11-13T10:00:00.000Z",
    deletedAt: null,
  };
}

describe("getTransactionDetailTarget", () => {
  it("opens the personal detail for an unlinked movement", () => {
    expect(getTransactionDetailTarget(buildTransaction())).toBeNull();
  });

  it("opens the group expense of a group-linked movement", () => {
    expect(
      getTransactionDetailTarget({
        ...buildTransaction(),
        groupExpenseId: "group-expense-1",
      }),
    ).toBe("/social/group-expenses/group-expense-1");
  });

  it("opens the shared expense and keeps it ahead of the group link", () => {
    expect(
      getTransactionDetailTarget({
        ...buildTransaction(),
        sharedExpenseId: "expense-1",
        groupExpenseId: "group-expense-1",
      }),
    ).toBe("/social/expenses/expense-1");
  });

  it("keeps the settlement income first", () => {
    expect(
      getTransactionDetailTarget({
        ...buildTransaction(),
        type: "income",
        settlementId: "settlement-1",
        groupExpenseId: "group-expense-1",
      }),
    ).toBe("/social/settlements/settlement-1");
  });

  it("opens the group settlement of a group-settlement income", () => {
    expect(
      getTransactionDetailTarget({
        ...buildTransaction(),
        type: "income",
        groupSettlementId: "group-settlement-1",
      }),
    ).toBe("/social/group-settlements/group-settlement-1");
  });
});
