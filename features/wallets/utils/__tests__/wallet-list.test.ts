import { describe, expect, it } from "@jest/globals";

import { Wallet } from "../../types/wallet.types";
import { replaceWallet } from "../wallet-list";

function buildWallet(id: string, name: string): Wallet {
  return {
    id,
    name,
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
  };
}

describe("replaceWallet", () => {
  it("replaces the matching wallet and preserves the order", () => {
    const wallets = [buildWallet("a", "A"), buildWallet("b", "B")];

    expect(
      replaceWallet(wallets, buildWallet("b", "B actualizada")).map(
        (wallet) => wallet.name,
      ),
    ).toEqual(["A", "B actualizada"]);
  });

  it("keeps the list unchanged when the wallet is not present", () => {
    const wallets = [buildWallet("a", "A")];

    expect(replaceWallet(wallets, buildWallet("missing", "X"))).toEqual(wallets);
  });
});
