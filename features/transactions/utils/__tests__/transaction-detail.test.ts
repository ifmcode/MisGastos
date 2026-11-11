import { describe, expect, it } from "@jest/globals";

import { Category } from "@/features/categories/types/category.types";
import { Wallet } from "@/features/wallets/types/wallet.types";

import { Transaction } from "../../types/transaction.types";
import {
  buildTransactionDetailFields,
  getTransactionDetailSummary,
  getTransactionWalletInfo,
  getTransactionWalletLabel,
} from "../transaction-detail";

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

describe("getTransactionDetailSummary", () => {
  it("describes an expense with its formatted amount and currency", () => {
    expect(getTransactionDetailSummary(buildTransaction({}))).toEqual({
      typeLabel: "Gasto",
      amountLabel: "1.234,50 €",
      currency: "EUR",
      isIncome: false,
    });
  });

  it("describes an income", () => {
    expect(
      getTransactionDetailSummary(buildTransaction({ type: "income" })),
    ).toMatchObject({ typeLabel: "Ingreso", isIncome: true });
  });
});

describe("getTransactionWalletInfo", () => {
  it("resolves the live wallet name", () => {
    expect(
      getTransactionWalletInfo(buildTransaction({}), [buildWallet({})]),
    ).toEqual({ name: "Cuenta principal", status: "active" });
  });

  it("flags an archived wallet while keeping its name", () => {
    expect(
      getTransactionWalletInfo(buildTransaction({}), [
        buildWallet({ archivedAt: "2026-11-01T10:00:00.000Z" }),
      ]),
    ).toEqual({ name: "Cuenta principal", status: "archived" });
  });

  it("falls back to the stored name for a deleted wallet", () => {
    expect(
      getTransactionWalletInfo(
        buildTransaction({
          walletId: "-1",
          walletName: "[Eliminada] Cuenta principal",
        }),
        [],
      ),
    ).toEqual({ name: "[Eliminada] Cuenta principal", status: "deleted" });
  });

  it("uses a safe label when no wallet or stored name is available", () => {
    expect(
      getTransactionWalletInfo(
        buildTransaction({ walletId: "missing-wallet" }),
        [],
      ),
    ).toEqual({ name: "Cartera no disponible", status: "deleted" });
  });
});

describe("getTransactionWalletLabel", () => {
  it("marks archived wallets", () => {
    expect(
      getTransactionWalletLabel({ name: "Cuenta", status: "archived" }),
    ).toBe("Cuenta (archivada)");
  });

  it("does not duplicate the deleted prefix", () => {
    expect(
      getTransactionWalletLabel({
        name: "[Eliminada] Cuenta",
        status: "deleted",
      }),
    ).toBe("[Eliminada] Cuenta");
  });

  it("marks deleted wallets that lost their prefix", () => {
    expect(
      getTransactionWalletLabel({ name: "Cuenta", status: "deleted" }),
    ).toBe("Cuenta (eliminada)");
  });
});

describe("buildTransactionDetailFields", () => {
  it("builds every read-only field, including notes", () => {
    expect(
      buildTransactionDetailFields(
        buildTransaction({ notes: "  Cena con amigos  " }),
        [buildWallet({})],
        [buildCategory({})],
      ),
    ).toEqual([
      { key: "wallet", label: "Cartera", value: "Cuenta principal" },
      { key: "category", label: "Categoría", value: "Alimentación" },
      { key: "concept", label: "Concepto", value: "Cena" },
      { key: "date", label: "Fecha", value: "20/10/2026" },
      { key: "notes", label: "Notas", value: "Cena con amigos" },
    ]);
  });

  it("shows a fallback when the movement has no notes", () => {
    const fields = buildTransactionDetailFields(
      buildTransaction({ notes: "   " }),
      [],
      [],
    );

    expect(fields.find((field) => field.key === "notes")?.value).toBe(
      "Sin notas",
    );
    expect(fields.find((field) => field.key === "category")?.value).toBe(
      "Sin categoría",
    );
  });
});
