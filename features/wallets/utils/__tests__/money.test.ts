import { describe, expect, it } from "@jest/globals";

import { Wallet } from "../../types/wallet.types";
import {
  calculateWalletBalance,
  calculateWalletTotals,
  formatMoney,
  getCurrencySymbol,
  roundMoney,
} from "../money";

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
    createdAt: "2026-10-28T10:00:00.000Z",
    updatedAt: "2026-10-28T10:00:00.000Z",
    ...overrides,
  };
}

describe("money helpers", () => {
  it("rounds to two decimals", () => {
    expect(roundMoney(1.005)).toBe(1.01);
    expect(roundMoney(0.1 + 0.2)).toBe(0.3);
    expect(roundMoney(-1.234)).toBe(-1.23);
  });

  it("returns currency symbols", () => {
    expect(getCurrencySymbol("EUR")).toBe("€");
    expect(getCurrencySymbol("USD")).toBe("$");
    expect(getCurrencySymbol("JPY")).toBe("¥");
  });

  it("formats amounts with Spanish separators and currency symbols", () => {
    expect(formatMoney(1234.5, "EUR")).toBe("1.234,50 €");
    expect(formatMoney(-1234.5, "USD")).toBe("-1.234,50 $");
    expect(formatMoney(0, "GBP")).toBe("0,00 £");
    expect(formatMoney(Number.NaN, "EUR")).toBe("0,00 €");
  });

  it("uses rounded values when formatting", () => {
    expect(formatMoney(1.005, "EUR")).toBe("1,01 €");
  });
});

describe("calculateWalletBalance", () => {
  it("adds movements and rounds the result", () => {
    expect(calculateWalletBalance(100, 25.5)).toBe(125.5);
    expect(calculateWalletBalance(0.1, 0.2)).toBe(0.3);
    expect(calculateWalletBalance(100, -25.555)).toBe(74.45);
  });

  it("returns the initial balance when there are no movements", () => {
    expect(calculateWalletBalance(99.99)).toBe(99.99);
  });
});

describe("calculateWalletTotals", () => {
  it("sums only included wallets, grouped by currency", () => {
    const totals = calculateWalletTotals([
      buildWallet({ id: "1", balance: 100, currency: "EUR" }),
      buildWallet({ id: "2", balance: 50.25, currency: "EUR" }),
      buildWallet({
        id: "3",
        balance: 999,
        currency: "EUR",
        includeInTotal: false,
      }),
      buildWallet({ id: "4", balance: 30, currency: "USD" }),
      buildWallet({ id: "5", balance: 15, currency: "GBP" }),
    ]);

    expect(totals).toEqual([
      { currency: "EUR", total: 150.25 },
      { currency: "GBP", total: 15 },
      { currency: "USD", total: 30 },
    ]);
  });

  it("avoids float drift when adding balances", () => {
    const totals = calculateWalletTotals([
      buildWallet({ id: "1", balance: 0.1 }),
      buildWallet({ id: "2", balance: 0.2 }),
    ]);

    expect(totals).toEqual([{ currency: "EUR", total: 0.3 }]);
  });

  it("supports negative totals", () => {
    const totals = calculateWalletTotals([
      buildWallet({ id: "1", balance: -25 }),
    ]);

    expect(totals).toEqual([{ currency: "EUR", total: -25 }]);
  });

  it("returns no totals when there are no included wallets", () => {
    expect(calculateWalletTotals([])).toEqual([]);
    expect(
      calculateWalletTotals([
        buildWallet({ includeInTotal: false, balance: 100 }),
      ]),
    ).toEqual([]);
  });
});
