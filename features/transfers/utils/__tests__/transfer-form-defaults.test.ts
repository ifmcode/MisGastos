import { beforeEach, describe, expect, it } from "@jest/globals";

import { getTodayIsoDate } from "@/shared/utils/date";
import { Transfer } from "@/features/transfers/types/transfer.types";
import { Wallet } from "@/features/wallets/types/wallet.types";
import {
  rememberLastUsedDate,
  resetLastUsedDate,
} from "@/shared/utils/last-used-date-store";

import {
  buildTransferFormValues,
  getDefaultTransferWallets,
} from "../transfer-form-defaults";

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

  it("preselects an active pair in the preferred currency", () => {
    const wallets = [
      buildWallet({ id: "wallet-eur" }),
      buildWallet({ id: "wallet-eur-2" }),
      buildWallet({ id: "wallet-usd", currency: "USD" }),
      buildWallet({ id: "wallet-usd-2", currency: "USD" }),
    ];

    const result = getDefaultTransferWallets(wallets, "USD");

    expect(result.fromWallet?.id).toBe("wallet-usd");
    expect(result.toWallet?.id).toBe("wallet-usd-2");
    expect(result.fromWallet?.currency).toBe(result.toWallet?.currency);
  });

  it("keeps the first pair when the preferred currency has no pair", () => {
    const wallets = [
      buildWallet({ id: "wallet-eur" }),
      buildWallet({ id: "wallet-eur-2" }),
      buildWallet({ id: "wallet-usd", currency: "USD" }),
    ];

    const result = getDefaultTransferWallets(wallets, "USD");

    expect(result.fromWallet?.id).toBe("wallet-eur");
    expect(result.toWallet?.id).toBe("wallet-eur-2");
  });

  it("ignores archived wallets when preselecting the preferred pair", () => {
    const wallets = [
      buildWallet({ id: "wallet-eur" }),
      buildWallet({ id: "wallet-eur-2" }),
      buildWallet({
        id: "wallet-usd-archived",
        currency: "USD",
        archivedAt: "2026-11-01T10:00:00.000Z",
      }),
    ];

    const result = getDefaultTransferWallets(wallets, "USD");

    expect(result.fromWallet?.id).toBe("wallet-eur");
    expect(result.toWallet?.id).toBe("wallet-eur-2");
  });
});

describe("buildTransferFormValues", () => {
  beforeEach(() => {
    resetLastUsedDate();
  });

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

  it("uses the last used date for a new transfer", () => {
    rememberLastUsedDate("2020-01-15");

    const wallets = [
      buildWallet({ id: "wallet-eur" }),
      buildWallet({ id: "wallet-eur-2" }),
    ];

    expect(buildTransferFormValues(wallets, null).date).toBe("2020-01-15");
  });

  it("defaults to EUR without wallets", () => {
    const values = buildTransferFormValues([], null);

    expect(values.fromWalletId).toBe("");
    expect(values.toWalletId).toBe("");
    expect(values.currency).toBe("EUR");
  });

  it("builds the preferred-currency pair for a new transfer", () => {
    const wallets = [
      buildWallet({ id: "wallet-eur" }),
      buildWallet({ id: "wallet-eur-2" }),
      buildWallet({ id: "wallet-usd", currency: "USD" }),
      buildWallet({ id: "wallet-usd-2", currency: "USD" }),
    ];

    const values = buildTransferFormValues(wallets, null, "USD");

    expect(values.fromWalletId).toBe("wallet-usd");
    expect(values.toWalletId).toBe("wallet-usd-2");
    expect(values.currency).toBe("USD");
  });

  it("keeps the stored wallets and currency when editing", () => {
    const values = buildTransferFormValues([], buildTransfer({}), "USD");

    expect(values.fromWalletId).toBe("wallet-eur");
    expect(values.toWalletId).toBe("wallet-eur-2");
    expect(values.currency).toBe("EUR");
  });
});
