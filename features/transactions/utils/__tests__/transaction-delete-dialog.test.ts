import { describe, expect, it } from "@jest/globals";

import { Wallet } from "@/features/wallets/types/wallet.types";

import { Transaction } from "../../types/transaction.types";
import { getDeleteTransactionConfirmation } from "../transaction-delete-dialog";

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

describe("getDeleteTransactionConfirmation", () => {
  it("includes the concept, amount and wallet name", () => {
    const confirmation = getDeleteTransactionConfirmation(
      buildTransaction({}),
      [buildWallet({})],
    );

    expect(confirmation).toEqual({
      title: "Eliminar movimiento",
      message:
        'Se eliminará "Cena" (25,50 €) de Cuenta principal y se revertirá el saldo.',
    });
  });

  it("falls back to a generic wallet label when the wallet is missing", () => {
    const confirmation = getDeleteTransactionConfirmation(
      buildTransaction({ walletId: "missing-wallet" }),
      [],
    );

    expect(confirmation.message).toContain("de esta cartera");
  });

  it("explains that orphaned movements have no balance to revert", () => {
    const confirmation = getDeleteTransactionConfirmation(
      buildTransaction({
        walletId: "-1",
        walletName: "[Eliminada] Cuenta principal",
      }),
      [],
    );

    expect(confirmation.message).toContain("no hay saldo que revertir");
    expect(confirmation.message).toContain("[Eliminada]");
  });
});
