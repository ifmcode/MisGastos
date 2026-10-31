import { describe, expect, it } from "@jest/globals";

import { mapTransferDocument } from "../transfer.mapper";

const baseData: Record<string, unknown> = {
  fromWalletId: "  wallet-1  ",
  toWalletId: "  wallet-2  ",
  amount: 50.255,
  currency: "EUR",
  date: "29/10/2026",
  notes: "  Ahorro mensual  ",
  ownerId: "owner-from-document",
  createdAt: "2026-10-29T10:00:00.000Z",
  updatedAt: "2026-10-29T11:00:00.000Z",
};

describe("mapTransferDocument", () => {
  it("maps a valid Firestore document", () => {
    expect(mapTransferDocument("transfer-1", baseData, "fallback-owner")).toEqual(
      {
        id: "transfer-1",
        fromWalletId: "wallet-1",
        toWalletId: "wallet-2",
        amount: 50.26,
        currency: "EUR",
        date: "2026-10-29",
        notes: "Ahorro mensual",
        ownerId: "owner-from-document",
        createdAt: "2026-10-29T10:00:00.000Z",
        updatedAt: "2026-10-29T11:00:00.000Z",
      },
    );
  });

  it("rejects documents without two different wallets", () => {
    expect(
      mapTransferDocument(
        "transfer-1",
        { ...baseData, fromWalletId: "   " },
        "user-1",
      ),
    ).toBeNull();
    expect(
      mapTransferDocument(
        "transfer-1",
        { ...baseData, toWalletId: "" },
        "user-1",
      ),
    ).toBeNull();
    expect(
      mapTransferDocument(
        "transfer-1",
        { ...baseData, fromWalletId: "wallet-1", toWalletId: "wallet-1" },
        "user-1",
      ),
    ).toBeNull();
  });

  it("rejects invalid amounts, currencies and dates", () => {
    for (const amount of [0, -10, "50", Number.POSITIVE_INFINITY]) {
      expect(
        mapTransferDocument(
          "transfer-1",
          { ...baseData, amount },
          "user-1",
        ),
      ).toBeNull();
    }

    expect(
      mapTransferDocument(
        "transfer-1",
        { ...baseData, currency: "BTC" },
        "user-1",
      ),
    ).toBeNull();
    expect(
      mapTransferDocument(
        "transfer-1",
        { ...baseData, date: "31/02/2026" },
        "user-1",
      ),
    ).toBeNull();
  });

  it("omits empty notes and falls back to the provided owner", () => {
    const transfer = mapTransferDocument(
      "transfer-1",
      { ...baseData, notes: "   ", ownerId: "   " },
      "fallback-owner",
    );

    expect(transfer?.ownerId).toBe("fallback-owner");
    expect(transfer && "notes" in transfer).toBe(false);
    expect(transfer && "deletedAt" in transfer).toBe(false);
  });

  it("maps the soft-delete timestamp when present", () => {
    const transfer = mapTransferDocument(
      "transfer-1",
      { ...baseData, deletedAt: "2026-10-30T08:00:00.000Z" },
      "user-1",
    );

    expect(transfer?.deletedAt).toBe("2026-10-30T08:00:00.000Z");
  });

  it("ignores invalid soft-delete timestamps", () => {
    const transfer = mapTransferDocument(
      "transfer-1",
      { ...baseData, deletedAt: "not-a-date" },
      "user-1",
    );

    expect(transfer && "deletedAt" in transfer).toBe(false);
  });

  it("supports Date and Firestore Timestamp-like values", () => {
    const createdAt = new Date("2026-10-29T09:00:00.000Z");
    const updatedAt = { toDate: () => new Date("2026-10-29T12:00:00.000Z") };

    const transfer = mapTransferDocument(
      "transfer-1",
      { ...baseData, createdAt, updatedAt },
      "user-1",
    );

    expect(transfer?.createdAt).toBe("2026-10-29T09:00:00.000Z");
    expect(transfer?.updatedAt).toBe("2026-10-29T12:00:00.000Z");
  });

  it("falls back to the epoch for invalid timestamps", () => {
    const transfer = mapTransferDocument(
      "transfer-1",
      { ...baseData, createdAt: "not-a-date", updatedAt: 123 },
      "user-1",
    );

    expect(transfer?.createdAt).toBe(new Date(0).toISOString());
    expect(transfer?.updatedAt).toBe(new Date(0).toISOString());
  });
});
