import { describe, expect, it } from "@jest/globals";

import { Wallet } from "@/features/wallets/types/wallet.types";
import { Transfer } from "../../types/transfer.types";
import {
  ensureTransferWallets,
  requireOwnerId,
  validateTransferRequest,
} from "../transfer-validation";

const input = {
  fromWalletId: "wallet-1",
  toWalletId: "wallet-2",
  amount: "25,50",
  currency: "EUR",
  notes: "",
  date: "29/10/2026",
};

function buildWallet(overrides: Partial<Wallet> = {}): Wallet {
  return {
    id: "wallet-1",
    name: "Cuenta",
    currency: "EUR",
    icon: "wallet",
    color: "#0A7EA4",
    initialBalance: 100,
    balance: 100,
    type: "bank",
    includeInTotal: true,
    ownerId: "user-1",
    createdAt: "2026-10-29T10:00:00.000Z",
    updatedAt: "2026-10-29T10:00:00.000Z",
    ...overrides,
  };
}

const previous: Transfer = {
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

describe("requireOwnerId", () => {
  it("trims the owner and rejects blank ids", () => {
    expect(requireOwnerId("  user-1  ")).toBe("user-1");
    expect(() => requireOwnerId(" ")).toThrow(
      expect.objectContaining({ name: "TransferValidationError" }),
    );
  });
});

describe("validateTransferRequest", () => {
  it("returns the normalized owner and transfer", () => {
    expect(validateTransferRequest("  user-1  ", input)).toMatchObject({
      ownerId: "user-1",
      value: { amount: 25.5, date: "2026-10-29" },
    });
  });

  it("reports only the owner issue when the fields are valid", () => {
    expect(() => validateTransferRequest(" ", input)).toThrow(
      expect.objectContaining({
        fieldErrors: {
          ownerId: "OWNER_REQUIRED",
        },
      }),
    );
  });

  it("combines owner and field issues", () => {
    expect(() =>
      validateTransferRequest(" ", { ...input, amount: "0" }),
    ).toThrow(
      expect.objectContaining({
        fieldErrors: expect.objectContaining({
          ownerId: expect.any(String),
          amount: expect.any(String),
        }),
      }),
    );
  });
});

describe("ensureTransferWallets", () => {
  const value = {
    fromWalletId: "wallet-1",
    toWalletId: "wallet-2",
    amount: 25.5,
    currency: "EUR" as const,
    date: "2026-10-29",
  };
  const wallets = [
    buildWallet(),
    buildWallet({ id: "wallet-2", balance: 50 }),
  ];

  function ensure(overrides: Record<string, unknown> = {}) {
    return ensureTransferWallets({
      wallets,
      value: { ...value, ...overrides },
    } as never);
  }

  it("accepts compatible wallets with enough balance", () => {
    expect(() => ensure()).not.toThrow();
  });

  it("rejects missing wallets", () => {
    expect(() => ensure({ toWalletId: "missing" })).toThrow(
      expect.objectContaining({ code: "TO_WALLET_NOT_FOUND" }),
    );
    expect(() => ensure({ fromWalletId: "missing" })).toThrow(
      expect.objectContaining({ code: "FROM_WALLET_NOT_FOUND" }),
    );
  });

  it("rejects the same wallet, currency mismatches and insufficient funds", () => {
    expect(() => ensure({ toWalletId: "wallet-1" })).toThrow(
      expect.objectContaining({ code: "SAME_WALLET" }),
    );
    expect(() =>
      ensureTransferWallets({
        wallets: [buildWallet(), buildWallet({ id: "wallet-2", currency: "USD" })],
        value,
      }),
    ).toThrow(expect.objectContaining({ code: "CURRENCY_MISMATCH" }));
    expect(() => ensure({ amount: 150 })).toThrow(
      expect.objectContaining({ code: "INSUFFICIENT_FUNDS" }),
    );
  });

  it("adds the previous outgoing amount back when editing", () => {
    expect(() =>
      ensureTransferWallets({
        wallets: [buildWallet({ balance: 0 }), buildWallet({ id: "wallet-2" })],
        value,
        previous,
      }),
    ).not.toThrow();
  });
});
