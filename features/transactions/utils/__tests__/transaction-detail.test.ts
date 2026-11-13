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

const t = (key: string) => key;
const formatCurrency = (value: number, currency: string) =>
  `${value} ${currency}`;
const formatDate = (isoDate: string) => isoDate;

describe("getTransactionDetailSummary", () => {
  it("describes an expense with its signed amount and currency", () => {
    expect(
      getTransactionDetailSummary(buildTransaction({}), formatCurrency, t),
    ).toEqual({
      label: "types.expense",
      amount: "-1234.5 EUR",
      meta: "EUR",
      tone: "negative",
    });
  });

  it("describes an income", () => {
    expect(
      getTransactionDetailSummary(
        buildTransaction({ type: "income" }),
        formatCurrency,
        t,
      ),
    ).toEqual({
      label: "types.income",
      amount: "+1234.5 EUR",
      meta: "EUR",
      tone: "positive",
    });
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

  it("uses an empty name when no wallet or stored name is available", () => {
    expect(
      getTransactionWalletInfo(
        buildTransaction({ walletId: "missing-wallet" }),
        [],
      ),
    ).toEqual({ name: "", status: "deleted" });
  });
});

describe("getTransactionWalletLabel", () => {
  it("marks archived wallets", () => {
    expect(
      getTransactionWalletLabel({ name: "Cuenta", status: "archived" }, t),
    ).toBe("Cuenta detail.archivedSuffix");
  });

  it("does not duplicate the deleted prefix", () => {
    expect(
      getTransactionWalletLabel(
        {
          name: "[Eliminada] Cuenta",
          status: "deleted",
        },
        t,
      ),
    ).toBe("[Eliminada] Cuenta");
  });

  it("marks deleted wallets that lost their prefix", () => {
    expect(
      getTransactionWalletLabel({ name: "Cuenta", status: "deleted" }, t),
    ).toBe("Cuenta detail.deletedSuffix");
  });
});

describe("buildTransactionDetailFields", () => {
  it("builds every read-only field, including notes", () => {
    expect(
      buildTransactionDetailFields(
        buildTransaction({ notes: "  Cena con amigos  " }),
        [buildWallet({})],
        [buildCategory({})],
        t,
        formatDate,
      ),
    ).toEqual([
      {
        key: "wallet",
        label: "detail.wallet",
        value: "Cuenta principal",
      },
      {
        key: "category",
        label: "detail.category",
        value: "Alimentación",
      },
      { key: "concept", label: "detail.concept", value: "Cena" },
      { key: "date", label: "detail.date", value: "2026-10-20" },
      {
        key: "notes",
        label: "detail.notes",
        value: "Cena con amigos",
      },
    ]);
  });

  it("shows translation keys when the movement has no notes", () => {
    const fields = buildTransactionDetailFields(
      buildTransaction({ notes: "   " }),
      [],
      [],
      t,
      formatDate,
    );

    expect(fields.find((field) => field.key === "notes")?.value).toBe(
      "common:states.noNotes",
    );
    expect(fields.find((field) => field.key === "category")?.value).toBe(
      "fallbackCategory",
    );
  });
});
