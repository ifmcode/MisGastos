import { describe, expect, it } from "@jest/globals";

import { mapWalletDocument } from "../wallet.mapper";

const baseData: Record<string, unknown> = {
  name: "  Cuenta principal  ",
  currency: "EUR",
  icon: "cash",
  color: "#0a7ea4",
  initialBalance: 100.25,
  balance: 150.5,
  type: "cash",
  includeInTotal: false,
  ownerId: "owner-from-document",
  createdAt: "2026-10-28T10:00:00.000Z",
  updatedAt: "2026-10-28T11:00:00.000Z",
  description: "  Gastos diarios  ",
};

describe("mapWalletDocument", () => {
  it("maps a valid Firestore document", () => {
    expect(mapWalletDocument("wallet-1", baseData, "fallback-owner")).toEqual({
      id: "wallet-1",
      name: "Cuenta principal",
      currency: "EUR",
      icon: "cash",
      color: "#0A7EA4",
      initialBalance: 100.25,
      balance: 150.5,
      type: "cash",
      includeInTotal: false,
      ownerId: "owner-from-document",
      createdAt: "2026-10-28T10:00:00.000Z",
      updatedAt: "2026-10-28T11:00:00.000Z",
      description: "Gastos diarios",
    });
  });

  it("rejects documents without a name, valid currency or valid type", () => {
    expect(
      mapWalletDocument("wallet-1", { ...baseData, name: "   " }, "user-1"),
    ).toBeNull();
    expect(
      mapWalletDocument(
        "wallet-1",
        { ...baseData, currency: "BTC" },
        "user-1",
      ),
    ).toBeNull();
    expect(
      mapWalletDocument(
        "wallet-1",
        { ...baseData, type: "credit" },
        "user-1",
      ),
    ).toBeNull();
  });

  it("applies safe defaults for optional or malformed fields", () => {
    const wallet = mapWalletDocument(
      "wallet-1",
      {
        name: "Efectivo",
        currency: "USD",
        type: "cash",
        icon: "not-an-icon",
        color: "not-a-color",
        initialBalance: -5,
        description: "   ",
      },
      "fallback-owner",
    );

    expect(wallet).toMatchObject({
      name: "Efectivo",
      icon: "wallet",
      color: "#0A7EA4",
      initialBalance: 0,
      balance: 0,
      includeInTotal: true,
      ownerId: "fallback-owner",
      createdAt: new Date(0).toISOString(),
      updatedAt: new Date(0).toISOString(),
    });
    expect(wallet && "description" in wallet).toBe(false);
  });

  it("uses the initial balance when balance is missing", () => {
    const wallet = mapWalletDocument(
      "wallet-1",
      { ...baseData, balance: undefined },
      "user-1",
    );

    expect(wallet?.balance).toBe(100.25);
  });

  it("supports Date and Firestore Timestamp-like values", () => {
    const createdAt = new Date("2026-10-28T09:00:00.000Z");
    const updatedAt = { toDate: () => new Date("2026-10-28T12:00:00.000Z") };

    const wallet = mapWalletDocument(
      "wallet-1",
      { ...baseData, createdAt, updatedAt },
      "user-1",
    );

    expect(wallet?.createdAt).toBe("2026-10-28T09:00:00.000Z");
    expect(wallet?.updatedAt).toBe("2026-10-28T12:00:00.000Z");
  });

  it("falls back to the epoch for invalid dates", () => {
    const wallet = mapWalletDocument(
      "wallet-1",
      { ...baseData, createdAt: "not-a-date", updatedAt: 123 },
      "user-1",
    );

    expect(wallet?.createdAt).toBe(new Date(0).toISOString());
    expect(wallet?.updatedAt).toBe(new Date(0).toISOString());
  });
});
