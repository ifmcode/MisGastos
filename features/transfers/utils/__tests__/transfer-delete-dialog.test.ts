import { describe, expect, it } from "@jest/globals";

import { Transfer } from "@/features/transfers/types/transfer.types";
import { Wallet } from "@/features/wallets/types/wallet.types";

import { getDeleteTransferConfirmation } from "../transfer-delete-dialog";

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
    amount: 25.5,
    currency: "EUR",
    date: "2026-10-20",
    ownerId: "user-1",
    createdAt: "2026-10-20T10:00:00.000Z",
    updatedAt: "2026-10-20T10:00:00.000Z",
    ...overrides,
  };
}

const messages = {
  bothOrphaned: "both",
  oneOrphaned: "one",
  noneOrphaned: "none",
};

describe("getDeleteTransferConfirmation", () => {
  it("includes the amount and both wallet names", () => {
    const confirmation = getDeleteTransferConfirmation(
      buildTransfer({}),
      [
        buildWallet({ id: "wallet-1", name: "Cuenta principal" }),
        buildWallet({ id: "wallet-2", name: "Ahorros" }),
      ],
      "25,50 €",
      "the wallet",
      "the deleted wallet",
      messages,
    );

    expect(confirmation).toEqual({
      titleKey: "deleteDialog.title",
      messageKey: "deleteDialog.message",
      values: {
        amount: "25,50 €",
        from: "Cuenta principal",
        to: "Ahorros",
        balanceMessage: "none",
      },
    });
  });

  it("falls back to generic labels when a wallet is missing", () => {
    const confirmation = getDeleteTransferConfirmation(
      buildTransfer({}),
      [],
      "25,50 €",
      "the wallet",
      "the deleted wallet",
      messages,
    );

    expect(confirmation.values.from).toBe("the wallet");
    expect(confirmation.values.to).toBe("the wallet");
  });

  it("uses stored names and clarifies orphaned wallet balances", () => {
    const confirmation = getDeleteTransferConfirmation(
      buildTransfer({
        fromWalletId: "-1",
        fromWalletName: "[Eliminada] Cuenta principal",
        toWalletId: "wallet-2",
      }),
      [buildWallet({ id: "wallet-2", name: "Ahorros" })],
      "25,50 €",
      "the wallet",
      "the deleted wallet",
      messages,
    );

    expect(confirmation.values.from).toBe("[Eliminada] Cuenta principal");
    expect(confirmation.values.balanceMessage).toBe("one");
  });

  it("explains when both wallets were deleted", () => {
    const confirmation = getDeleteTransferConfirmation(
      buildTransfer({ fromWalletId: "-1", toWalletId: "-1" }),
      [],
      "25,50 €",
      "the wallet",
      "the deleted wallet",
      messages,
    );

    expect(confirmation.values.balanceMessage).toBe("both");
  });
});
