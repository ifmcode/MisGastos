import { describe, expect, it } from "@jest/globals";

import { Wallet } from "@/features/wallets/types/wallet.types";

import { getDashboardTotals, getVisibleWallets } from "../dashboard-summary";

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

const wallets: Wallet[] = [
  buildWallet({
    id: "wallet-eur",
    balance: 500,
  }),
  buildWallet({
    id: "wallet-usd",
    currency: "USD",
    balance: 250,
  }),
  buildWallet({
    id: "wallet-excluded",
    balance: 300,
    includeInTotal: false,
  }),
];

describe("getDashboardTotals", () => {
  it("only includes wallets marked as part of the global total", () => {
    expect(getDashboardTotals(wallets, "")).toEqual([
      { currency: "EUR", total: 500 },
      { currency: "USD", total: 250 },
    ]);
  });

  it("groups included wallets by currency", () => {
    const totals = getDashboardTotals(
      [
        ...wallets,
        buildWallet({
          id: "wallet-eur-2",
          balance: 125.5,
        }),
      ],
      "",
    );

    expect(totals).toContainEqual({ currency: "EUR", total: 625.5 });
    expect(totals).toContainEqual({ currency: "USD", total: 250 });
  });

  it("shows the real balance of a selected wallet even when excluded", () => {
    expect(getDashboardTotals(wallets, "wallet-excluded")).toEqual([
      { currency: "EUR", total: 300 },
    ]);
  });

  it("returns no totals for an unknown selected wallet", () => {
    expect(getDashboardTotals(wallets, "wallet-missing")).toEqual([]);
  });
});

describe("getVisibleWallets", () => {
  it("returns every wallet when there is no filter", () => {
    const visible = getVisibleWallets(wallets, "");

    expect(visible).toEqual(wallets);
    expect(visible).not.toBe(wallets);
  });

  it("returns only the selected wallet", () => {
    expect(getVisibleWallets(wallets, "wallet-usd")).toEqual([wallets[1]]);
  });

  it("returns an empty list when the selected wallet does not exist", () => {
    expect(getVisibleWallets(wallets, "wallet-missing")).toEqual([]);
  });
});
