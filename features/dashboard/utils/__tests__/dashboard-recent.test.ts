import { describe, expect, it } from "@jest/globals";

import { Transfer } from "@/features/transfers/types/transfer.types";
import { Transaction } from "@/features/transactions/types/transaction.types";

import { getRecentMovements, getRecentTransfers } from "../dashboard-recent";

function buildMovement(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: "movement-1",
    type: "expense",
    amount: 10,
    currency: "EUR",
    walletId: "wallet-1",
    categoryId: "category-1",
    concept: "Cena",
    date: "2026-11-08",
    ownerId: "user-1",
    createdAt: "2026-11-08T20:00:00.000Z",
    updatedAt: "2026-11-08T20:00:00.000Z",
    ...overrides,
  };
}

function buildTransfer(overrides: Partial<Transfer> = {}): Transfer {
  return {
    id: "transfer-1",
    fromWalletId: "wallet-1",
    toWalletId: "wallet-2",
    amount: 25,
    currency: "EUR",
    date: "2026-11-08",
    ownerId: "user-1",
    createdAt: "2026-11-08T20:00:00.000Z",
    updatedAt: "2026-11-08T20:00:00.000Z",
    ...overrides,
  };
}

describe("getRecentMovements", () => {
  it("returns only the three newest movements and flags more", () => {
    const movements = [
      buildMovement({ id: "oldest", date: "2026-11-01" }),
      buildMovement({ id: "newest", date: "2026-11-04" }),
      buildMovement({ id: "third", date: "2026-11-03" }),
      buildMovement({ id: "second", date: "2026-11-02" }),
    ];

    const result = getRecentMovements(movements);

    expect(result.items.map((movement) => movement.id)).toEqual([
      "newest",
      "third",
      "second",
    ]);
    expect(result.hasMore).toBe(true);
  });

  it("does not flag more when there are exactly three movements", () => {
    const result = getRecentMovements([
      buildMovement({ id: "one", date: "2026-11-01" }),
      buildMovement({ id: "two", date: "2026-11-02" }),
      buildMovement({ id: "three", date: "2026-11-03" }),
    ]);

    expect(result.items).toHaveLength(3);
    expect(result.hasMore).toBe(false);
  });
});

describe("getRecentTransfers", () => {
  it("returns only the three newest transfers and flags more", () => {
    const transfers = [
      buildTransfer({ id: "oldest", date: "2026-11-01" }),
      buildTransfer({ id: "newest", date: "2026-11-04" }),
      buildTransfer({ id: "third", date: "2026-11-03" }),
      buildTransfer({ id: "second", date: "2026-11-02" }),
    ];

    const result = getRecentTransfers(transfers);

    expect(result.items.map((transfer) => transfer.id)).toEqual([
      "newest",
      "third",
      "second",
    ]);
    expect(result.hasMore).toBe(true);
  });

  it("does not flag more when there are exactly three transfers", () => {
    const result = getRecentTransfers([
      buildTransfer({ id: "one", date: "2026-11-01" }),
      buildTransfer({ id: "two", date: "2026-11-02" }),
      buildTransfer({ id: "three", date: "2026-11-03" }),
    ]);

    expect(result.items).toHaveLength(3);
    expect(result.hasMore).toBe(false);
  });
});
