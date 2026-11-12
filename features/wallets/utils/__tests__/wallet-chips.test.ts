import { describe, expect, it } from "@jest/globals";

import { Wallet } from "../../types/wallet.types";
import { getActiveWallets } from "../wallet-status";
import { COMPACT_WALLET_LIMIT, getWalletChips } from "../wallet-chips";

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

const wallets: readonly Wallet[] = [
  buildWallet({ id: "cash", name: "Efectivo", type: "cash", balance: 120 }),
  buildWallet({ id: "bank", name: "Cuenta principal", balance: 540.5 }),
  buildWallet({
    id: "juanilla",
    name: "Juanilla",
    type: "other",
    currency: "EUR",
    balance: 30,
  }),
];

describe("getWalletChips", () => {
  it("shows at most three wallet chips", () => {
    const chips = getWalletChips(wallets, "cash");

    expect(chips.visible).toHaveLength(COMPACT_WALLET_LIMIT);
    expect(chips.visible.map((wallet) => wallet.id)).toEqual([
      "cash",
      "bank",
      "juanilla",
    ]);
  });

  it("keeps the selected wallet visible when it is beyond the first three", () => {
    const chips = getWalletChips(wallets, "juanilla");

    expect(chips.visible[0].id).toBe("juanilla");
    expect(chips.visible).toHaveLength(COMPACT_WALLET_LIMIT);
  });

  it("lists every active wallet exactly once across chips and popup", () => {
    const chips = getWalletChips(wallets, "juanilla", 2);
    const popupIds = [...chips.visible, ...chips.hidden].map(
      (wallet) => wallet.id,
    );

    expect(chips.hidden.map((wallet) => wallet.id)).toEqual(["bank"]);
    expect(popupIds).toHaveLength(wallets.length);
    expect(new Set(popupIds)).toEqual(
      new Set(wallets.map((wallet) => wallet.id)),
    );
  });

  it("includes the other/EUR wallet with a non-zero balance", () => {
    const active = getActiveWallets([
      ...wallets,
      buildWallet({
        id: "archived",
        name: "Antigua",
        archivedAt: "2026-11-01T10:00:00.000Z",
      }),
    ]);
    const juanilla = active.find((wallet) => wallet.id === "juanilla");
    const chips = getWalletChips(active, "juanilla");

    expect(active).toHaveLength(3);
    expect(juanilla).toMatchObject({
      name: "Juanilla",
      type: "other",
      currency: "EUR",
      balance: 30,
    });
    expect(chips.visible[0]).toBe(juanilla);
    expect(active.some((wallet) => wallet.id === "archived")).toBe(false);
  });

  it("shows every wallet when there are fewer than three", () => {
    const chips = getWalletChips(wallets.slice(0, 2), "bank");

    expect(chips.visible).toHaveLength(2);
    expect(chips.hidden).toHaveLength(0);
  });

  it("handles zero wallets", () => {
    const chips = getWalletChips([], "");

    expect(chips.visible).toHaveLength(0);
    expect(chips.hidden).toHaveLength(0);
  });
});
