import { describe, expect, it } from "@jest/globals";

import { Transfer } from "../../types/transfer.types";
import { Wallet } from "@/features/wallets/types/wallet.types";
import {
  getAvailableDestinations,
  getAvailableSourceBalance,
  getInitialTransferFormValues,
  getProjectedSourceBalance,
  getTransferAmountHelper,
} from "../transfer-form-derivations";

function buildWallet(overrides: Partial<Wallet>): Wallet {
  return {
    id: "wallet-1",
    name: "Cuenta principal",
    currency: "EUR",
    icon: "wallet",
    color: "#0A7EA4",
    initialBalance: 0,
    balance: 100,
    type: "bank",
    includeInTotal: true,
    ownerId: "user-1",
    createdAt: "2026-10-29T10:00:00.000Z",
    updatedAt: "2026-10-29T10:00:00.000Z",
    ...overrides,
  };
}

const transfer: Transfer = {
  id: "transfer-1",
  fromWalletId: "wallet-1",
  toWalletId: "wallet-2",
  amount: 25.5,
  currency: "EUR",
  date: "2026-10-29",
  ownerId: "user-1",
  createdAt: "2026-10-29T10:00:00.000Z",
  updatedAt: "2026-10-29T10:00:00.000Z",
};

const formValues = {
  fromWalletId: "wallet-1",
  toWalletId: "wallet-2",
  amount: "10",
  currency: "EUR" as const,
  date: "",
  notes: "",
};

describe("getInitialTransferFormValues", () => {
  it("fills the default date only when it is empty", () => {
    expect(getInitialTransferFormValues(formValues).date).toMatch(/^\d{4}-/);
    expect(
      getInitialTransferFormValues({ ...formValues, date: "2026-10-29" }).date,
    ).toBe("2026-10-29");
  });
});

describe("getAvailableDestinations", () => {
  it("keeps same-currency wallets except the source", () => {
    const wallets = [
      buildWallet({ id: "wallet-1" }),
      buildWallet({ id: "wallet-2" }),
      buildWallet({ id: "wallet-usd", currency: "USD" }),
    ];

    expect(
      getAvailableDestinations(wallets, "wallet-1").map((item) => item.id),
    ).toEqual(["wallet-2"]);
  });

  it("returns nothing when the source is unknown", () => {
    expect(
      getAvailableDestinations([buildWallet({ id: "wallet-1" })], "missing"),
    ).toEqual([]);
  });
});

describe("getAvailableSourceBalance", () => {
  it("returns zero without a wallet", () => {
    expect(getAvailableSourceBalance(undefined, null)).toBe(0);
  });

  it("adds back an outgoing edit and subtracts an incoming one", () => {
    const wallet = buildWallet({ id: "wallet-1", balance: 74.5 });

    expect(getAvailableSourceBalance(wallet, transfer)).toBe(100);
    expect(
      getAvailableSourceBalance(wallet, {
        ...transfer,
        fromWalletId: "wallet-2",
        toWalletId: "wallet-1",
      }),
    ).toBe(49);
  });

  it("keeps the balance when the edit belongs to other wallets", () => {
    expect(
      getAvailableSourceBalance(buildWallet({ id: "wallet-3" }), transfer),
    ).toBe(100);
  });
});

describe("getProjectedSourceBalance", () => {
  it("subtracts comma decimals and ignores invalid text", () => {
    expect(getProjectedSourceBalance(100, "25,5")).toBe(74.5);
    expect(getProjectedSourceBalance(100, "")).toBe(100);
  });
});

describe("getTransferAmountHelper", () => {
  it("passes the localized balances to the translation key", () => {
    const t = (key: string, options?: Record<string, unknown>) =>
      `${key}:${options?.available}:${options?.projected}`;

    expect(
      getTransferAmountHelper(100, 74.5, "EUR", (value) => `${value}`, t),
    ).toBe("form.amountHelper:100:74.5");
  });
});
