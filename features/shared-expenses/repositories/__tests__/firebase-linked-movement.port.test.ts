import { describe, expect, it } from "@jest/globals";

import { FirebaseLinkedMovementPort } from "../firebase-linked-movement.port";
import type { LinkedMovementWriteInput } from "../linked-movement.port";

const port = new FirebaseLinkedMovementPort();

const writeInput: LinkedMovementWriteInput = {
  movementId: "movement-1",
  ownerId: "user-a",
  walletId: "wallet-1",
  sharedExpenseId: "expense-1",
  amountCents: 1000,
  currency: "EUR",
  categoryId: "category-1",
  concept: "Dinner",
  date: "2026-11-16",
  createdAt: "2026-11-16T10:00:00.000Z",
  updatedAt: "2026-11-16T11:00:00.000Z",
};

describe("FirebaseLinkedMovementPort.readMovement", () => {
  it("returns null for missing or unusable documents", () => {
    expect(port.readMovement("m", { exists: false, data: undefined })).toBeNull();
    expect(
      port.readMovement("m", { exists: true, data: { walletId: "", amount: 10 } }),
    ).toBeNull();
    expect(
      port.readMovement("m", { exists: true, data: { walletId: "w", amount: 0 } }),
    ).toBeNull();
    expect(
      port.readMovement("m", {
        exists: true,
        data: { walletId: "w", amount: "10" },
      }),
    ).toBeNull();
  });

  it("reads the movement state in integer cents", () => {
    const movement = port.readMovement("movement-1", {
      exists: true,
      data: {
        walletId: " wallet-1 ",
        amount: 12.34,
        ownerId: " user-a ",
        currency: "EUR",
        createdAt: " 2026-11-16T10:00:00.000Z ",
        deletedAt: " 2026-11-16T12:00:00.000Z ",
      },
    });

    expect(movement).toEqual({
      id: "movement-1",
      ownerId: "user-a",
      walletId: "wallet-1",
      amountCents: 1234,
      currency: "EUR",
      createdAt: "2026-11-16T10:00:00.000Z",
      deletedAt: "2026-11-16T12:00:00.000Z",
    });
  });

  it("defaults a blank creation and delete stamp to null", () => {
    const movement = port.readMovement("movement-1", {
      exists: true,
      data: { walletId: "wallet-1", amount: 10, createdAt: " ", deletedAt: null },
    });

    expect(movement).toMatchObject({ createdAt: null, deletedAt: null });
  });
});

describe("FirebaseLinkedMovementPort data builders", () => {
  it("builds a full expense document with the shared link", () => {
    expect(port.buildCreateData(writeInput)).toMatchObject({
      type: "expense",
      amount: 10,
      currency: "EUR",
      walletId: "wallet-1",
      categoryId: "category-1",
      concept: "Dinner",
      date: "2026-11-16",
      ownerId: "user-a",
      sharedExpenseId: "expense-1",
      createdAt: "2026-11-16T11:00:00.000Z",
      updatedAt: "2026-11-16T11:00:00.000Z",
      deletedAt: null,
    });
  });

  it("keeps the creation stamp and owner out of an update patch", () => {
    const data = port.buildUpdateData(writeInput);

    expect(data).not.toHaveProperty("createdAt");
    expect(data).not.toHaveProperty("ownerId");
    expect(data).toMatchObject({ amount: 10, deletedAt: null });
  });
});

describe("FirebaseLinkedMovementPort balance helpers", () => {
  it("converts cents at the single boundary", () => {
    expect(port.toAmount(2550)).toBe(25.5);
    expect(port.toAmount(1)).toBe(0.01);
  });

  it("applies and reverts the expense on a wallet balance", () => {
    expect(port.applyAmountToBalance(100, 2500)).toBe(75);
    expect(port.revertAmountFromBalance(75, 2500)).toBe(100);
  });
});
