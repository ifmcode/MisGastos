import { describe, expect, it } from "@jest/globals";

import { Wallet } from "@/features/wallets/types/wallet.types";

import { Transfer } from "../../types/transfer.types";
import {
  buildTransferDetailFields,
  getTransferDetailSubtitle,
  getTransferDetailSummary,
} from "../transfer-detail";

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

const wallets = [
  buildWallet({ id: "wallet-1", name: "Cuenta principal" }),
  buildWallet({ id: "wallet-2", name: "Ahorros" }),
];
const t = (key: string) => key;
const formatCurrency = (value: number, currency: string) =>
  `${value} ${currency}`;
const formatDate = (isoDate: string) => isoDate;

describe("getTransferDetailSummary", () => {
  it("shows the amount and currency without an income/expense sign", () => {
    expect(
      getTransferDetailSummary(buildTransfer({}), formatCurrency, t),
    ).toEqual({
      label: "detail.summaryLabel",
      amount: "10 EUR",
      meta: "EUR",
      tone: "neutral",
    });
  });
});

describe("getTransferDetailSubtitle", () => {
  it("summarizes the two wallets of the transfer", () => {
    expect(getTransferDetailSubtitle(buildTransfer({}), wallets, t)).toBe(
      "Cuenta principal → Ahorros",
    );
  });
});

describe("buildTransferDetailFields", () => {
  it("builds origin, destination, date and notes", () => {
    expect(
      buildTransferDetailFields(
        buildTransfer({ notes: "  Traspaso al fondo  " }),
        wallets,
        t,
        formatDate,
      ),
    ).toEqual([
      { key: "from", label: "detail.from", value: "Cuenta principal" },
      { key: "to", label: "detail.to", value: "Ahorros" },
      { key: "date", label: "detail.date", value: "2026-10-29" },
      { key: "notes", label: "detail.notes", value: "Traspaso al fondo" },
    ]);
  });

  it("falls back to the no-notes copy when notes are missing", () => {
    const fields = buildTransferDetailFields(
      buildTransfer({ notes: "   " }),
      wallets,
      t,
      formatDate,
    );

    expect(fields.find((field) => field.key === "notes")?.value).toBe(
      "common:states.noNotes",
    );
  });

  it("keeps a long note untouched so the card can wrap it", () => {
    const longNote = "Traspaso ".repeat(40).trim();
    const fields = buildTransferDetailFields(
      buildTransfer({ notes: longNote }),
      wallets,
      t,
      formatDate,
    );

    expect(fields.find((field) => field.key === "notes")?.value).toBe(longNote);
  });

  it("keeps the live name of an archived wallet", () => {
    const fields = buildTransferDetailFields(
      buildTransfer({}),
      [
        buildWallet({
          id: "wallet-1",
          name: "Ahorros antiguos",
          archivedAt: "2026-11-01T10:00:00.000Z",
        }),
        wallets[1],
      ],
      t,
      formatDate,
    );

    expect(fields.find((field) => field.key === "from")?.value).toBe(
      "Ahorros antiguos",
    );
  });

  it("keeps the stored [Eliminada] label of a deleted wallet", () => {
    const fields = buildTransferDetailFields(
      buildTransfer({
        fromWalletId: "-1",
        fromWalletName: "[Eliminada] Efectivo",
      }),
      wallets,
      t,
      formatDate,
    );

    expect(fields.find((field) => field.key === "from")?.value).toBe(
      "[Eliminada] Efectivo",
    );
  });

  it("uses the generic deleted-wallet label when no stored name exists", () => {
    const fields = buildTransferDetailFields(
      buildTransfer({ toWalletId: "missing-wallet" }),
      wallets,
      t,
      formatDate,
    );

    expect(fields.find((field) => field.key === "to")?.value).toBe(
      "deletedWalletName",
    );
  });
});
