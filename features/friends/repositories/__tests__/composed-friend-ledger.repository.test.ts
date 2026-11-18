import { describe, expect, it, jest } from "@jest/globals";

import { ComposedFriendLedgerRepository } from "../composed-friend-ledger.repository";
import type { IFriendLedgerRepository } from "../friend-ledger.repository";
import type { FriendLedgerEntry } from "../../types/friend.types";

function entry(id: string): FriendLedgerEntry {
  return {
    id,
    fromUserId: "user-a",
    toUserId: "user-b",
    amountCents: 100,
    currency: "EUR",
    deletedAt: null,
  };
}

function fakeLedger(entries: FriendLedgerEntry[]): IFriendLedgerRepository {
  return { getEntries: jest.fn(async () => entries) };
}

describe("ComposedFriendLedgerRepository", () => {
  it("concatenates every source in order", async () => {
    const expenses = fakeLedger([entry("expense-1")]);
    const settlements = fakeLedger([entry("settlement:1")]);

    const entries = await new ComposedFriendLedgerRepository([
      expenses,
      settlements,
    ]).getEntries("user-a");

    expect(entries.map((row) => row.id)).toEqual(["expense-1", "settlement:1"]);
    expect(expenses.getEntries).toHaveBeenCalledWith("user-a");
    expect(settlements.getEntries).toHaveBeenCalledWith("user-a");
  });

  it("returns an empty list without sources", async () => {
    await expect(
      new ComposedFriendLedgerRepository([]).getEntries("user-a"),
    ).resolves.toEqual([]);
  });
});
