import { describe, expect, it } from "@jest/globals";

import { Transaction } from "../../types/transaction.types";
import {
  getTransactionDetailLabel,
  OPEN_TRANSACTION_DETAIL_HINT_KEY,
} from "../transaction-item-accessibility";

function buildTransaction(overrides: Partial<Transaction>): Transaction {
  return {
    id: "transaction-1",
    type: "expense",
    amount: 1234.5,
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

describe("getTransactionDetailLabel", () => {
  it("summarizes an expense and announces the detail action", () => {
    expect(
      getTransactionDetailLabel(
        buildTransaction({ concept: "Supermercado" }),
        "Alimentación",
        "1.234,50 €",
        "20/10/2026",
        "Cuenta principal",
      ),
    ).toEqual({
      key: "accessibility.detailLabelWithWallet",
      values: {
        typeKey: "types.expense",
        concept: "Supermercado",
        amount: "1.234,50 €",
        date: "20/10/2026",
        category: "Alimentación",
        wallet: "Cuenta principal",
      },
    });
  });

  it("announces an income and omits a missing wallet", () => {
    expect(
      getTransactionDetailLabel(
        buildTransaction({ type: "income", concept: "Nómina" }),
        "Salario",
        "1.234,50 €",
        "20/10/2026",
      ),
    ).toEqual({
      key: "accessibility.detailLabel",
      values: {
        typeKey: "types.income",
        concept: "Nómina",
        amount: "1.234,50 €",
        date: "20/10/2026",
        category: "Salario",
      },
    });
  });
});

describe("OPEN_TRANSACTION_DETAIL_HINT_KEY", () => {
  it("points to the detail hint key", () => {
    expect(OPEN_TRANSACTION_DETAIL_HINT_KEY).toBe(
      "accessibility.openDetailHint",
    );
  });
});
