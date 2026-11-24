import { describe, expect, it } from "@jest/globals";

import type { Category } from "@/features/categories/types/category.types";
import type { Wallet } from "@/features/wallets/types/wallet.types";

import {
  findSettlementIncomeCategoryOption,
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
    revision: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function buildCategory(overrides: Partial<Category>): Category {
  return {
    id: "category-1",
    name: "Salario",
    icon: "cash-outline",
    color: "#000000",
    type: "income",
    ownerId: "user-a",
    revision: 0,
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
  it("keeps only income categories and a stale selected one, with its icon", () => {
    const options = getSettlementIncomeCategoryOptions(
      [
        buildCategory({ id: "salary" }),
        buildCategory({ id: "rent", type: "expense" }),
      ],
      "removed",
    );

    expect(options).toEqual([
      {
        id: "salary",
        name: "Salario",
        icon: "cash-outline",
        unavailable: false,
      },
      {
        id: "removed",
        name: "",
        icon: "receipt-outline",
        unavailable: true,
      },
    ]);
  });

  it("falls back to the receipt icon for an unknown stored icon", () => {
    const options = getSettlementIncomeCategoryOptions([
      buildCategory({ id: "salary", icon: "not-an-icon" }),
    ]);

    expect(options[0].icon).toBe("receipt-outline");
  });

  it("keeps a legacy selected id selected instead of marking it unavailable", () => {
    const options = getSettlementIncomeCategoryOptions(
      [buildCategory({ id: "user-a__salary", legacyId: "salary" })],
      "salary",
    );

    expect(options).toHaveLength(1);
    expect(options[0].unavailable).toBe(false);
    expect(findSettlementIncomeCategoryOption(options, "salary")?.id).toBe(
      "user-a__salary",
    );
    expect(findSettlementIncomeCategoryOption(options, "")).toBeUndefined();
  });
});
