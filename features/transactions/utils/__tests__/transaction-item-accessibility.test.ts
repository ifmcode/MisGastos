import { describe, expect, it } from "@jest/globals";

import { Transaction } from "../../types/transaction.types";
import {
  EDIT_TRANSACTION_HINT,
  getTransactionEditLabel,
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

describe("getTransactionEditLabel", () => {
  it("summarizes an expense and announces the edit action", () => {
    expect(
      getTransactionEditLabel(
        buildTransaction({ concept: "Supermercado" }),
        "Alimentación",
        "Cuenta principal",
      ),
    ).toBe(
      "Editar gasto: Supermercado, 1.234,50 €, 20/10/2026, Alimentación, Cuenta principal",
    );
  });

  it("announces an income and omits a missing wallet", () => {
    expect(
      getTransactionEditLabel(
        buildTransaction({ type: "income", concept: "Nómina" }),
        "Salario",
      ),
    ).toBe("Editar ingreso: Nómina, 1.234,50 €, 20/10/2026, Salario");
  });
});

describe("EDIT_TRANSACTION_HINT", () => {
  it("explains that the form also allows deleting", () => {
    expect(EDIT_TRANSACTION_HINT).toContain("editar");
    expect(EDIT_TRANSACTION_HINT).toContain("eliminar");
  });
});
