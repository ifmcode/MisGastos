import { describe, expect, it } from "@jest/globals";

import { Wallet } from "@/features/wallets/types/wallet.types";

import { canTransferBetweenWallets } from "../transfer-wallets";

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

describe("canTransferBetweenWallets", () => {
  it("requires at least two wallets", () => {
    expect(canTransferBetweenWallets([])).toBe(false);
    expect(canTransferBetweenWallets([buildWallet({})])).toBe(false);
  });

  it("requires two wallets sharing a currency", () => {
    const wallets = [
      buildWallet({ id: "wallet-eur" }),
      buildWallet({ id: "wallet-usd", currency: "USD" }),
    ];

    expect(canTransferBetweenWallets(wallets)).toBe(false);
  });

  it("allows transfers when two wallets share a currency", () => {
    const wallets = [
      buildWallet({ id: "wallet-eur" }),
      buildWallet({ id: "wallet-usd", currency: "USD" }),
      buildWallet({ id: "wallet-eur-2" }),
    ];

    expect(canTransferBetweenWallets(wallets)).toBe(true);
  });
});
