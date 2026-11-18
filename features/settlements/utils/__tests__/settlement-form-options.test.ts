import { describe, expect, it } from "@jest/globals";

import type { Category } from "@/features/categories/types/category.types";
import type { Wallet } from "@/features/wallets/types/wallet.types";

import {
  getSettlementDefaultCategoryId,
  getSettlementIncomeCategoryOptions,
  getSettlementWalletChoices,
} from "../settlement-form-options";

function buildWallet(overrides: Partial<Wallet>): Wallet {
  return {
    id: "wallet-1",
    name: "Cuenta",
    currency: "EUR",
    icon: "wallet",
    color: "#000000",
    initialBalance: 0,
    balance: 0,
    type: "bank",
    includeInTotal: true,
    ownerId: "user-a",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function buildCategory(overrides: Partial<Category>): Category {
  return {
    id: "category-1",
    name: "Salario",
    icon: "cash",
    color: "#000000",
    type: "income",
    ownerId: "user-a",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("getSettlementWalletChoices", () => {
  it("offers only active same-currency wallets", () => {
    const choices = getSettlementWalletChoices(
      [
        buildWallet({ id: "eur" }),
        buildWallet({ id: "usd", currency: "USD" }),
        buildWallet({ id: "archived", archivedAt: "2026-11-01T00:00:00.000Z" }),
      ],
      "EUR",
    );

    expect(choices.map((wallet) => wallet.id)).toEqual(["eur"]);
  });

  it("keeps a linked archived wallet visible and first", () => {
    const choices = getSettlementWalletChoices(
      [
        buildWallet({ id: "eur" }),
        buildWallet({
          id: "archived",
          archivedAt: "2026-11-01T00:00:00.000Z",
        }),
      ],
      "EUR",
      "archived",
    );

    expect(choices.map((wallet) => wallet.id)).toEqual(["archived", "eur"]);
  });
});

describe("settlement income categories", () => {
  it("keeps only income categories and a stale selected one", () => {
    const options = getSettlementIncomeCategoryOptions(
      [
        buildCategory({ id: "salary" }),
        buildCategory({ id: "rent", type: "expense" }),
      ],
      "removed",
    );

    expect(options).toEqual([
      { id: "salary", name: "Salario", unavailable: false },
      { id: "removed", name: "", unavailable: true },
    ]);
  });

  it("defaults to the first income category", () => {
    expect(
      getSettlementDefaultCategoryId([
        buildCategory({ id: "expense", type: "expense" }),
        buildCategory({ id: "salary" }),
      ]),
    ).toBe("salary");
    expect(getSettlementDefaultCategoryId([])).toBe("");
  });
});
