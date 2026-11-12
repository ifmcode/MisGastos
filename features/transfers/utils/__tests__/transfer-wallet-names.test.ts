import { describe, expect, it } from "@jest/globals";

import { Wallet } from "@/features/wallets/types/wallet.types";

import { Transfer } from "../../types/transfer.types";
import {
  DELETED_TRANSFER_WALLET_NAME_KEY,
  getTransferWalletNames,
  resolveTransferWalletName,
} from "../transfer-wallet-names";

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

function buildTransfer(overrides: Partial<Transfer>): Transfer {
  return {
    id: "transfer-1",
    fromWalletId: "wallet-1",
    toWalletId: "wallet-2",
    amount: 10,
    currency: "EUR",
    date: "2026-10-29",
    ownerId: "user-1",
    createdAt: "2026-10-29T10:00:00.000Z",
    updatedAt: "2026-10-29T10:00:00.000Z",
    ...overrides,
  };
}

describe("resolveTransferWalletName", () => {
  it("prefers the live wallet name, including archived wallets", () => {
    const archived = buildWallet({
      id: "wallet-archived",
      name: "Ahorros",
      archivedAt: "2026-10-30T10:00:00.000Z",
    });

    expect(resolveTransferWalletName(archived, "[Eliminada] Antigua")).toBe(
      "Ahorros",
    );
  });

  it("falls back to the stored name for deleted wallets", () => {
    expect(
      resolveTransferWalletName(undefined, "[Eliminada] Cuenta principal"),
    ).toBe("[Eliminada] Cuenta principal");
  });

  it("uses a readable generic label when no name is available", () => {
    expect(resolveTransferWalletName(undefined, undefined)).toBe(
      DELETED_TRANSFER_WALLET_NAME_KEY,
    );
  });
});

describe("getTransferWalletNames", () => {
  it("resolves both sides of a transfer", () => {
    const names = getTransferWalletNames(
      buildTransfer({
        fromWalletId: "-1",
        fromWalletName: "[Eliminada] Efectivo",
        toWalletId: "wallet-2",
      }),
      undefined,
      buildWallet({ id: "wallet-2", name: "Ahorros" }),
    );

    expect(names).toEqual({
      fromName: "[Eliminada] Efectivo",
      toName: "Ahorros",
    });
  });
});
