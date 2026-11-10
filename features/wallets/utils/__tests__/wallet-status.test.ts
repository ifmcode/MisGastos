import { describe, expect, it } from "@jest/globals";

import { Wallet } from "../../types/wallet.types";
import {
  getActiveWallets,
  getArchivedWallets,
  isWalletActive,
  isWalletArchived,
} from "../wallet-status";

function buildWallet(id: string, archivedAt?: string): Wallet {
  return {
    id,
    name: `Cartera ${id}`,
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
    ...(archivedAt ? { archivedAt } : {}),
  };
}

describe("wallet status helpers", () => {
  it("detects archived and active wallets", () => {
    const active = buildWallet("active");
    const archived = buildWallet("archived", "2026-11-01T10:00:00.000Z");

    expect(isWalletActive(active)).toBe(true);
    expect(isWalletArchived(active)).toBe(false);
    expect(isWalletActive(archived)).toBe(false);
    expect(isWalletArchived(archived)).toBe(true);
  });

  it("splits wallets without mutating the source list", () => {
    const wallets = [
      buildWallet("active-1"),
      buildWallet("archived", "2026-11-01T10:00:00.000Z"),
      buildWallet("active-2"),
    ];

    expect(getActiveWallets(wallets).map((wallet) => wallet.id)).toEqual([
      "active-1",
      "active-2",
    ]);
    expect(getArchivedWallets(wallets).map((wallet) => wallet.id)).toEqual([
      "archived",
    ]);
    expect(wallets).toHaveLength(3);
  });
});
