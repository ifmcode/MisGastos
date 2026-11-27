import { describe, expect, it } from "@jest/globals";

import { readOutboxWalletDeltas } from "../pending-balance";
import { buildMutation } from "./outbox.fixtures";

const expense = (amountCents: number, walletId = "wallet-1") => ({
  walletId,
  payerId: "user-a",
  amountCents,
  currency: "EUR",
});

const settlement = (amountCents: number, walletId = "wallet-1") => ({
  receiverWalletId: walletId,
  toUserId: "user-a",
  amountCents,
  currency: "EUR",
});

describe("readOutboxWalletDeltas - social movements", () => {
  it("debits the payer wallet on a shared expense create", () => {
    const deltas = readOutboxWalletDeltas([
      buildMutation({
        entityType: "shared-expense",
        localSnapshot: expense(1250),
      }),
    ]);

    expect(deltas.get("wallet-1")).toBe(-12.5);
  });

  it("applies local minus server on a group expense update", () => {
    const deltas = readOutboxWalletDeltas([
      buildMutation({
        entityType: "group-expense",
        operation: "update",
        localSnapshot: expense(3000),
        serverSnapshot: expense(1000),
      }),
    ]);

    expect(deltas.get("wallet-1")).toBe(-20);
  });

  it("reverts the server effect on a delete", () => {
    const deltas = readOutboxWalletDeltas([
      buildMutation({
        entityType: "group-expense",
        operation: "delete",
        localSnapshot: expense(1000),
        serverSnapshot: expense(1000),
      }),
    ]);

    expect(deltas.get("wallet-1")).toBe(10);
  });

  it("credits the receiver wallet on a settlement create", () => {
    const deltas = readOutboxWalletDeltas([
      buildMutation({
        entityType: "settlement",
        localSnapshot: settlement(500),
      }),
      buildMutation({
        clientMutationId: "group",
        entityId: "group-settlement-1",
        entityType: "group-settlement",
        localSnapshot: settlement(750, "wallet-2"),
      }),
    ]);

    expect(deltas.get("wallet-1")).toBe(5);
    expect(deltas.get("wallet-2")).toBe(7.5);
  });

  it("ignores a movement without a wallet link", () => {
    const deltas = readOutboxWalletDeltas([
      buildMutation({
        entityType: "shared-expense",
        localSnapshot: { ...expense(1000), walletId: null },
      }),
    ]);

    expect(deltas.size).toBe(0);
  });
});
