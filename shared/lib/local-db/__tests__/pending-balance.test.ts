import { describe, expect, it } from "@jest/globals";

import { readOutboxWalletDeltas } from "../pending-balance";
import { buildMutation } from "./outbox.fixtures";

function transactionSnapshot(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    type: "expense",
    amount: 10,
    walletId: "wallet-1",
    ...overrides,
  };
}

function transferSnapshot(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    fromWalletId: "wallet-1",
    toWalletId: "wallet-2",
    amount: 10,
    ...overrides,
  };
}

describe("readOutboxWalletDeltas", () => {
  it("returns an empty map for an empty queue", () => {
    expect(readOutboxWalletDeltas([]).size).toBe(0);
  });

  it("applies a transaction create with its signed amount", () => {
    const deltas = readOutboxWalletDeltas([
      buildMutation({
        operation: "create",
        localSnapshot: transactionSnapshot({ type: "expense", amount: 25.5 }),
      }),
      buildMutation({
        clientMutationId: "income",
        entityId: "tx-2",
        operation: "create",
        localSnapshot: transactionSnapshot({
          type: "income",
          amount: 10,
          walletId: "wallet-2",
        }),
      }),
    ]);

    expect(deltas.get("wallet-1")).toBe(-25.5);
    expect(deltas.get("wallet-2")).toBe(10);
  });

  it("uses local minus server for a transaction update", () => {
    const deltas = readOutboxWalletDeltas([
      buildMutation({
        operation: "update",
        localSnapshot: transactionSnapshot({ type: "expense", amount: 30 }),
        serverSnapshot: transactionSnapshot({ type: "expense", amount: 10 }),
      }),
    ]);

    expect(deltas.get("wallet-1")).toBe(-20);
  });

  it("reverts the server effect on a transaction delete", () => {
    const deltas = readOutboxWalletDeltas([
      buildMutation({
        operation: "delete",
        localSnapshot: transactionSnapshot({ type: "expense", amount: 30 }),
        serverSnapshot: transactionSnapshot({ type: "expense", amount: 10 }),
      }),
    ]);

    expect(deltas.get("wallet-1")).toBe(10);
  });

  it("falls back to the local snapshot when deleting without a server state", () => {
    const deltas = readOutboxWalletDeltas([
      buildMutation({
        operation: "delete",
        localSnapshot: transactionSnapshot({ type: "income", amount: 7 }),
        serverSnapshot: {},
      }),
    ]);

    expect(deltas.get("wallet-1")).toBe(-7);
  });

  it("keeps a create pending as create when it is edited offline", () => {
    const deltas = readOutboxWalletDeltas([
      buildMutation({
        operation: "create",
        localSnapshot: transactionSnapshot({ type: "expense", amount: 42 }),
        serverSnapshot: {},
      }),
    ]);

    expect(deltas.get("wallet-1")).toBe(-42);
  });

  it("applies a transfer create to both wallets", () => {
    const deltas = readOutboxWalletDeltas([
      buildMutation({
        entityType: "transfer",
        entityId: "transfer-1",
        operation: "create",
        localSnapshot: transferSnapshot({ amount: 40 }),
      }),
    ]);

    expect(deltas.get("wallet-1")).toBe(-40);
    expect(deltas.get("wallet-2")).toBe(40);
  });

  it("applies the local minus server matrix to a transfer update", () => {
    const deltas = readOutboxWalletDeltas([
      buildMutation({
        entityType: "transfer",
        entityId: "transfer-1",
        operation: "update",
        localSnapshot: transferSnapshot({
          fromWalletId: "wallet-1",
          toWalletId: "wallet-3",
          amount: 30,
        }),
        serverSnapshot: transferSnapshot({
          fromWalletId: "wallet-1",
          toWalletId: "wallet-2",
          amount: 10,
        }),
      }),
    ]);

    expect(deltas.get("wallet-1")).toBe(-20);
    expect(deltas.get("wallet-2")).toBe(-10);
    expect(deltas.get("wallet-3")).toBe(30);
  });

  it("reverts the server effect on a transfer delete", () => {
    const deltas = readOutboxWalletDeltas([
      buildMutation({
        entityType: "transfer",
        entityId: "transfer-1",
        operation: "delete",
        localSnapshot: transferSnapshot({ amount: 30 }),
        serverSnapshot: transferSnapshot({ amount: 10 }),
      }),
    ]);

    expect(deltas.get("wallet-1")).toBe(10);
    expect(deltas.get("wallet-2")).toBe(-10);
  });

  it("reverts the local effect when deleting a transfer with no server state", () => {
    const deltas = readOutboxWalletDeltas([
      buildMutation({
        entityType: "transfer",
        entityId: "transfer-1",
        operation: "delete",
        localSnapshot: transferSnapshot({ amount: 15 }),
        serverSnapshot: {},
      }),
    ]);

    expect(deltas.get("wallet-1")).toBe(15);
    expect(deltas.get("wallet-2")).toBe(-15);
  });

  it("includes pending, syncing, failed and conflict rows", () => {
    const deltas = readOutboxWalletDeltas([
      buildMutation({ status: "pending", localSnapshot: transactionSnapshot() }),
      buildMutation({
        clientMutationId: "m2",
        entityId: "tx-2",
        status: "syncing",
        localSnapshot: transactionSnapshot(),
      }),
      buildMutation({
        clientMutationId: "m3",
        entityId: "tx-3",
        status: "failed",
        localSnapshot: transactionSnapshot(),
      }),
      buildMutation({
        clientMutationId: "m4",
        entityId: "tx-4",
        status: "conflict",
        localSnapshot: transactionSnapshot(),
      }),
    ]);

    expect(deltas.get("wallet-1")).toBe(-40);
  });

  it("ignores wallet and category mutations", () => {
    const deltas = readOutboxWalletDeltas([
      buildMutation({
        entityType: "wallet",
        localSnapshot: { id: "wallet-1", balance: 999 },
      }),
      buildMutation({
        entityType: "category",
        entityId: "category-1",
        localSnapshot: { id: "category-1" },
      }),
    ]);

    expect(deltas.size).toBe(0);
  });

  it("ignores malformed snapshots without throwing", () => {
    const deltas = readOutboxWalletDeltas([
      buildMutation({ localSnapshot: { type: "expense", amount: 10 } }),
      buildMutation({ localSnapshot: { type: "other", amount: 10, walletId: "w" } }),
      buildMutation({ localSnapshot: { type: "expense", amount: 0, walletId: "w" } }),
      buildMutation({
        localSnapshot: { type: "expense", amount: Number.NaN, walletId: "w" },
      }),
      buildMutation({
        entityType: "transfer",
        localSnapshot: { fromWalletId: "wallet-1", amount: 10 },
      }),
      buildMutation({
        entityType: "transfer",
        localSnapshot: {
          fromWalletId: "wallet-1",
          toWalletId: "wallet-1",
          amount: 10,
        },
      }),
      buildMutation({
        localSnapshot: null as unknown as Record<string, unknown>,
      }),
    ]);

    expect(deltas.size).toBe(0);
  });

  it("rounds float drift instead of accumulating it", () => {
    const deltas = readOutboxWalletDeltas([
      buildMutation({
        operation: "create",
        localSnapshot: transactionSnapshot({ amount: 0.1 }),
      }),
      buildMutation({
        clientMutationId: "m2",
        entityId: "tx-2",
        operation: "create",
        localSnapshot: transactionSnapshot({ amount: 0.2 }),
      }),
    ]);

    expect(deltas.get("wallet-1")).toBe(-0.3);
  });

  it("returns the orphan id without applying it to a real wallet", () => {
    const deltas = readOutboxWalletDeltas([
      buildMutation({
        operation: "create",
        localSnapshot: transactionSnapshot({ walletId: "-1", amount: 5 }),
      }),
    ]);

    expect(deltas.get("-1")).toBe(-5);
    expect(deltas.has("wallet-1")).toBe(false);
  });
});
