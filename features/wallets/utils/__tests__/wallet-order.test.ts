import { describe, expect, it } from "@jest/globals";

import { Wallet } from "../../types/wallet.types";
import {
  applyWalletOrder,
  compareWallets,
  moveWallet,
  renumberWallets,
} from "../wallet-order";

function buildWallet(overrides: Partial<Wallet> = {}): Wallet {
  return {
    id: "wallet-1",
    name: "Cuenta principal",
    currency: "EUR",
    icon: "cash",
    color: "#0A7EA4",
    initialBalance: 100,
    balance: 100,
    type: "cash",
    includeInTotal: true,
    ownerId: "user-1",
    revision: 0,
    createdAt: "2026-10-28T10:00:00.000Z",
    updatedAt: "2026-10-28T10:00:00.000Z",
    ...overrides,
  };
}

function ids(wallets: readonly Wallet[]): string[] {
  return wallets.map((wallet) => wallet.id);
}

describe("compareWallets", () => {
  it("sorts by explicit sortOrder ascending", () => {
    const wallets = [
      buildWallet({ id: "third", sortOrder: 2 }),
      buildWallet({ id: "first", sortOrder: 0 }),
      buildWallet({ id: "second", sortOrder: 1 }),
    ];

    expect(ids(wallets.sort(compareWallets))).toEqual([
      "first",
      "second",
      "third",
    ]);
  });

  it("keeps the legacy newest-first order when no sortOrder exists", () => {
    const wallets = [
      buildWallet({
        id: "older-b",
        name: "Ahorros",
        createdAt: "2026-10-28T09:00:00.000Z",
      }),
      buildWallet({
        id: "newer",
        name: "Cuenta principal",
        createdAt: "2026-10-28T11:00:00.000Z",
      }),
      buildWallet({
        id: "older-a",
        name: "Efectivo",
        createdAt: "2026-10-28T09:00:00.000Z",
      }),
    ];

    expect(ids(wallets.sort(compareWallets))).toEqual([
      "newer",
      "older-b",
      "older-a",
    ]);
  });

  it("places explicit positions before legacy wallets", () => {
    const legacy = buildWallet({ id: "legacy" });
    const explicit = buildWallet({ id: "explicit", sortOrder: 5 });

    expect(ids([legacy, explicit].sort(compareWallets))).toEqual([
      "explicit",
      "legacy",
    ]);
    expect(ids([explicit, legacy].sort(compareWallets))).toEqual([
      "explicit",
      "legacy",
    ]);
  });

  it("falls back to the legacy order when two positions are equal", () => {
    const first = buildWallet({
      id: "first",
      sortOrder: 0,
      createdAt: "2026-10-28T09:00:00.000Z",
    });
    const second = buildWallet({
      id: "second",
      sortOrder: 0,
      createdAt: "2026-10-28T10:00:00.000Z",
    });

    expect(ids([second, first].sort(compareWallets))).toEqual([
      "second",
      "first",
    ]);
  });

  it("treats negative and non-finite positions as legacy", () => {
    const wallets = [
      buildWallet({
        id: "negative",
        sortOrder: -1,
        createdAt: "2026-10-28T12:00:00.000Z",
      }),
      buildWallet({ id: "infinite", sortOrder: Number.POSITIVE_INFINITY }),
      buildWallet({ id: "explicit", sortOrder: 9 }),
    ];

    expect(ids(wallets.sort(compareWallets))).toEqual([
      "explicit",
      "negative",
      "infinite",
    ]);
  });
});

describe("renumberWallets", () => {
  it("assigns array positions and reports only changed documents", () => {
    const wallets = [
      buildWallet({ id: "a", sortOrder: 1 }),
      buildWallet({ id: "b" }),
      buildWallet({ id: "c", sortOrder: 2 }),
    ];

    const result = renumberWallets(wallets);

    expect(result.wallets.map((wallet) => wallet.sortOrder)).toEqual([0, 1, 2]);
    expect(result.changed).toEqual([
      { id: "a", sortOrder: 0 },
      { id: "b", sortOrder: 1 },
    ]);
    expect(wallets[0]?.sortOrder).toBe(1);
  });
});

describe("applyWalletOrder", () => {
  const wallets = [
    buildWallet({ id: "a", sortOrder: 0 }),
    buildWallet({ id: "b", sortOrder: 1 }),
    buildWallet({ id: "c", sortOrder: 2 }),
  ];

  it("builds the requested order and reports the stale positions", () => {
    const result = applyWalletOrder(wallets, ["c", "a", "b"]);

    expect(ids(result.wallets)).toEqual(["c", "a", "b"]);
    expect(result.changed).toEqual([
      { id: "c", sortOrder: 0 },
      { id: "a", sortOrder: 1 },
      { id: "b", sortOrder: 2 },
    ]);
  });

  it("trims ids and ignores blank, duplicated and unknown ones", () => {
    const result = applyWalletOrder(wallets, [" c ", "c", " ", "missing", "a"]);

    expect(ids(result.wallets)).toEqual(["c", "a", "b"]);
  });

  it("keeps the wallets missing from the sequence at the end", () => {
    const result = applyWalletOrder(wallets, ["b"]);

    expect(ids(result.wallets)).toEqual(["b", "a", "c"]);
    expect(result.wallets).toHaveLength(wallets.length);
  });

  it("never loses a wallet for an empty sequence", () => {
    const result = applyWalletOrder(wallets, []);

    expect(ids(result.wallets)).toEqual(["a", "b", "c"]);
    expect(result.changed).toEqual([]);
  });
});

describe("moveWallet", () => {
  const wallets = [
    buildWallet({ id: "a", sortOrder: 0 }),
    buildWallet({ id: "b", sortOrder: 1 }),
    buildWallet({ id: "c", sortOrder: 2 }),
  ];

  it("swaps with the previous and next neighbour", () => {
    const up = moveWallet(wallets, "b", "up", ["a", "b", "c"]);
    const down = moveWallet(wallets, "b", "down", ["a", "b", "c"]);

    expect(up && ids(up.wallets)).toEqual(["b", "a", "c"]);
    expect(down && ids(down.wallets)).toEqual(["a", "c", "b"]);
    expect(up?.changed).toEqual([
      { id: "b", sortOrder: 0 },
      { id: "a", sortOrder: 1 },
    ]);
  });

  it("returns null at the edges and for unknown wallets", () => {
    expect(moveWallet(wallets, "a", "up", ["a", "b", "c"])).toBeNull();
    expect(moveWallet(wallets, "c", "down", ["a", "b", "c"])).toBeNull();
    expect(moveWallet(wallets, "missing", "up", ["a", "b", "c"])).toBeNull();
  });

  it("moves past the next visible wallet only", () => {
    const filtered = [
      buildWallet({ id: "active-a", sortOrder: 0 }),
      buildWallet({
        id: "archived",
        sortOrder: 1,
        archivedAt: "2026-10-29T10:00:00.000Z",
      }),
      buildWallet({ id: "active-b", sortOrder: 2 }),
    ];

    const result = moveWallet(filtered, "active-a", "down", [
      "active-a",
      "active-b",
    ]);

    expect(result && ids(result.wallets)).toEqual([
      "active-b",
      "archived",
      "active-a",
    ]);
    expect(result?.wallets.map((wallet) => wallet.sortOrder)).toEqual([0, 1, 2]);
  });

  it("renumbers the full collection without moving archived wallets", () => {
    const filtered = [
      buildWallet({ id: "active-a", sortOrder: 0 }),
      buildWallet({ id: "active-b", sortOrder: 1 }),
      buildWallet({
        id: "archived",
        sortOrder: 2,
        archivedAt: "2026-10-29T10:00:00.000Z",
      }),
    ];

    const result = moveWallet(filtered, "active-a", "down", [
      "active-a",
      "active-b",
    ]);

    expect(result && ids(result.wallets)).toEqual([
      "active-b",
      "active-a",
      "archived",
    ]);
    expect(result?.changed).toEqual([
      { id: "active-b", sortOrder: 0 },
      { id: "active-a", sortOrder: 1 },
    ]);
  });
});
