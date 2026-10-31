import { describe, expect, it } from "@jest/globals";

import { getTodayIsoDate } from "@/features/transactions/utils/transaction-date";
import { Transfer } from "@/features/transfers/types/transfer.types";
import { Wallet } from "@/features/wallets/types/wallet.types";

import {
  buildTransferFormValues,
  getDefaultTransferWallets,
} from "../dashboard-transfer-defaults";

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
    fromWalletId: "wallet-eur",
    toWalletId: "wallet-eur-2",
    amount: 25.5,
    currency: "EUR",
    date: "2026-10-20",
    ownerId: "user-1",
    createdAt: "2026-10-20T10:00:00.000Z",
    updatedAt: "2026-10-20T10:00:00.000Z",
    ...overrides,
  };
}

describe("getDefaultTransferWallets", () => {
  it("returns empty defaults when there are no wallets", () => {
    expect(getDefaultTransferWallets([])).toEqual({
      fromWallet: null,
      toWallet: null,
    });
  });

  it("prefers a wallet that shares its currency with another one", () => {
    const usd = buildWallet({ id: "wallet-usd", currency: "USD" });
    const eur = buildWallet({ id: "wallet-eur" });
    const eurSecond = buildWallet({ id: "wallet-eur-2" });
    const eurThird = buildWallet({ id: "wallet-eur-3" });

    const result = getDefaultTransferWallets([usd, eur, eurSecond, eurThird]);

    expect(result.fromWallet?.id).toBe("wallet-eur");
    expect(result.toWallet?.id).toBe("wallet-eur-2");
  });

  it("falls back to the first wallet without a destination", () => {
    const wallets = [
      buildWallet({ id: "wallet-eur" }),
      buildWallet({ id: "wallet-usd", currency: "USD" }),
    ];

    const result = getDefaultTransferWallets(wallets);

    expect(result.fromWallet?.id).toBe("wallet-eur");
    expect(result.toWallet).toBeNull();
  });
});

describe("buildTransferFormValues", () => {
  it("maps the edited transfer into form values", () => {
    const values = buildTransferFormValues([], buildTransfer({}));

    expect(values).toEqual({
      fromWalletId: "wallet-eur",
      toWalletId: "wallet-eur-2",
      amount: "25.5",
      currency: "EUR",
      date: "2026-10-20",
      notes: "",
    });
  });

  it("keeps the notes of the edited transfer", () => {
    const values = buildTransferFormValues(
      [],
      buildTransfer({ notes: "Alquiler" }),
    );

    expect(values.notes).toBe("Alquiler");
  });

  it("builds today's defaults for a new transfer", () => {
    const wallets = [
      buildWallet({ id: "wallet-eur" }),
      buildWallet({ id: "wallet-eur-2" }),
    ];

    const values = buildTransferFormValues(wallets, null);

    expect(values).toEqual({
      fromWalletId: "wallet-eur",
      toWalletId: "wallet-eur-2",
      amount: "",
      currency: "EUR",
      date: getTodayIsoDate(),
      notes: "",
    });
  });

  it("defaults to EUR without wallets", () => {
    const values = buildTransferFormValues([], null);

    expect(values.fromWalletId).toBe("");
    expect(values.toWalletId).toBe("");
    expect(values.currency).toBe("EUR");
  });
});
