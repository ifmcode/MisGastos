import { describe, expect, it } from "@jest/globals";

import type { SettlementMovementWriteInput } from "../settlement-movement.port";
import { FirebaseSettlementMovementPort } from "../firebase-settlement-movement.port";

const port = new FirebaseSettlementMovementPort();

const input: SettlementMovementWriteInput = {
  movementId: "movement-1",
  ownerId: "user-b",
  walletId: "wallet-1",
  settlementId: "settlement-1",
  amountCents: 1250,
  currency: "EUR",
  categoryId: "category-1",
  concept: "Dinner",
  date: "2026-11-10",
  createdAt: "2026-11-10T20:00:00.000Z",
  updatedAt: "2026-11-16T10:00:00.000Z",
};

describe("buildCreateData", () => {
  it("writes an income with the settlement link", () => {
    expect(port.buildCreateData(input)).toMatchObject({
      type: "income",
      amount: 12.5,
      currency: "EUR",
      walletId: "wallet-1",
      categoryId: "category-1",
      concept: "Dinner",
      date: "2026-11-10",
      ownerId: "user-b",
      settlementId: "settlement-1",
      createdAt: "2026-11-16T10:00:00.000Z",
      updatedAt: "2026-11-16T10:00:00.000Z",
      deletedAt: null,
    });
  });
});

describe("buildUpdateData", () => {
  it("never rewrites the creation stamp or the owner", () => {
    const data = port.buildUpdateData(input);

    expect(data).not.toHaveProperty("createdAt");
    expect(data).not.toHaveProperty("ownerId");
    expect(data).toMatchObject({ amount: 12.5, settlementId: "settlement-1" });
  });
});

describe("group settlement link", () => {
  it("writes exactly the provided link key", () => {
    const data = port.buildCreateData({
      ...input,
      settlementId: undefined,
      groupSettlementId: "group-settlement-1",
    });

    expect(data.groupSettlementId).toBe("group-settlement-1");
    expect(data).not.toHaveProperty("settlementId");
  });
});

describe("readMovement", () => {
  it("reads a usable income", () => {
    expect(
      port.readMovement("movement-1", {
        exists: true,
        data: {
          ownerId: "user-b",
          walletId: "wallet-1",
          amount: 12.5,
          currency: "EUR",
          createdAt: "2026-11-10T20:00:00.000Z",
          deletedAt: null,
        },
      }),
    ).toEqual({
      id: "movement-1",
      ownerId: "user-b",
      walletId: "wallet-1",
      amountCents: 1250,
      currency: "EUR",
      deletedAt: null,
      createdAt: "2026-11-10T20:00:00.000Z",
    });
  });

  it("keeps a soft-delete stamp and normalizes empty values", () => {
    const state = port.readMovement("movement-1", {
      exists: true,
      data: {
        walletId: "wallet-1",
        amount: 10,
        deletedAt: " 2026-11-15T10:00:00.000Z ",
        createdAt: "   ",
      },
    });

    expect(state?.deletedAt).toBe("2026-11-15T10:00:00.000Z");
    expect(state?.createdAt).toBeNull();
    expect(state?.ownerId).toBe("");
  });

  it("returns null for unusable documents", () => {
    expect(port.readMovement("movement-1", { exists: false, data: undefined })).toBeNull();
    expect(port.readMovement("movement-1", { exists: true, data: undefined })).toBeNull();
    expect(
      port.readMovement("movement-1", { exists: true, data: { amount: 10 } }),
    ).toBeNull();
    expect(
      port.readMovement("movement-1", {
        exists: true,
        data: { walletId: "wallet-1", amount: 0 },
      }),
    ).toBeNull();
    expect(
      port.readMovement("movement-1", {
        exists: true,
        data: { walletId: "wallet-1", amount: "10" },
      }),
    ).toBeNull();
    expect(
      port.readMovement("movement-1", {
        exists: true,
        data: { walletId: "wallet-1", amount: Number.NaN },
      }),
    ).toBeNull();
  });
});

describe("money boundaries", () => {
  it("converts cents once and applies an income", () => {
    expect(port.toAmount(1250)).toBe(12.5);
    expect(port.applyAmountToBalance(100, 1250)).toBe(112.5);
    expect(port.revertAmountFromBalance(112.5, 1250)).toBe(100);
  });
});
