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
      "25,50 €",
    );

    expect(confirmation).toEqual({
      titleKey: "deleteDialog.title",
      messageKey: "deleteDialog.message",
      values: {
        concept: "Cena",
        amount: "25,50 €",
        wallet: "Cuenta principal",
      },
    });
  });

  it("falls back to the generic wallet value when the wallet is missing", () => {
    const confirmation = getDeleteTransactionConfirmation(
      buildTransaction({ walletId: "missing-wallet" }),
      [],
      "25,50 €",
    );

    expect(confirmation.values.wallet).toBe("");
  });

  it("explains that orphaned movements have no balance to revert", () => {
    const confirmation = getDeleteTransactionConfirmation(
      buildTransaction({
        walletId: "-1",
        walletName: "[Eliminada] Cuenta principal",
      }),
      [],
      "25,50 €",
    );

    expect(confirmation.messageKey).toBe("deleteDialog.messageOrphan");
    expect(confirmation.values.wallet).toBe("[Eliminada] Cuenta principal");
  });

  it("uses the no-wallet orphan message when no stored name exists", () => {
    const confirmation = getDeleteTransactionConfirmation(
      buildTransaction({ walletId: "-1", walletName: undefined }),
      [],
      "25,50 €",
    );

    expect(confirmation.messageKey).toBe(
      "deleteDialog.messageOrphanNoWallet",
    );
  });
});
