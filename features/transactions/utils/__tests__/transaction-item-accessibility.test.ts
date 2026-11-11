import { describe, expect, it } from "@jest/globals";

import { Transaction } from "../../types/transaction.types";
import {
  getTransactionDetailLabel,
  OPEN_TRANSACTION_DETAIL_HINT,
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
        "Cuenta principal",
      ),
    ).toBe(
      "Ver detalle del gasto: Supermercado, 1.234,50 €, 20/10/2026, Alimentación, Cuenta principal",
    );
  });

  it("announces an income and omits a missing wallet", () => {
    expect(
      getTransactionDetailLabel(
        buildTransaction({ type: "income", concept: "Nómina" }),
        "Salario",
      ),
    ).toBe("Ver detalle del ingreso: Nómina, 1.234,50 €, 20/10/2026, Salario");
  });
});

describe("OPEN_TRANSACTION_DETAIL_HINT", () => {
  it("explains that the detail view allows editing and deleting", () => {
    expect(OPEN_TRANSACTION_DETAIL_HINT).toContain("detalle");
    expect(OPEN_TRANSACTION_DETAIL_HINT).toContain("editar");
    expect(OPEN_TRANSACTION_DETAIL_HINT).toContain("eliminar");
  });
});
