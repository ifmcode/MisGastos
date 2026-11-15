import { describe, expect, it } from "@jest/globals";

import type { FriendLedgerEntry } from "../../types/friend.types";
import {
  calculateFriendNetBalance,
  centsToAmount,
  filterFriendLedgerEntries,
  getFriendBalanceDirection,
} from "../friend-balance";

function entry(
  overrides: Partial<FriendLedgerEntry> = {},
): FriendLedgerEntry {
  return {
    id: "entry-1",
    fromUserId: "user-b",
    toUserId: "user-a",
    amountCents: 1000,
    deletedAt: null,
    ...overrides,
  };
}

describe("filterFriendLedgerEntries", () => {
  it("keeps only active entries of the pair", () => {
    const entries = [
      entry({ id: "1" }),
      entry({ id: "2", fromUserId: "user-a", toUserId: "user-b" }),
      entry({ id: "3", deletedAt: "2026-11-14T00:00:00.000Z" }),
      entry({ id: "4", toUserId: "user-c" }),
    ];

    expect(filterFriendLedgerEntries(entries, "user-a", "user-b").map((e) => e.id))
      .toEqual(["1", "2"]);
  });

  it("treats an empty deletedAt as active and ignores self pairs", () => {
    const entries = [entry({ deletedAt: "" })];

    expect(filterFriendLedgerEntries(entries, "user-a", "user-b")).toHaveLength(1);
    expect(filterFriendLedgerEntries(entries, "user-a", "user-a")).toEqual([]);
    expect(filterFriendLedgerEntries(entries, "", "user-b")).toEqual([]);
  });
});

describe("calculateFriendNetBalance", () => {
  it("is positive when the friend owes the viewer", () => {
    const entries = [
      entry({ fromUserId: "user-b", toUserId: "user-a", amountCents: 1500 }),
    ];

    expect(calculateFriendNetBalance(entries, "user-a", "user-b")).toBe(1500);
  });

  it("is negative when the viewer owes the friend", () => {
    const entries = [
      entry({ fromUserId: "user-a", toUserId: "user-b", amountCents: 2500 }),
    ];

    expect(calculateFriendNetBalance(entries, "user-a", "user-b")).toBe(-2500);
  });

  it("folds several entries of both directions", () => {
    const entries = [
      entry({ id: "1", amountCents: 3000 }),
      entry({
        id: "2",
        fromUserId: "user-a",
        toUserId: "user-b",
        amountCents: 1250,
      }),
      entry({
        id: "3",
        fromUserId: "user-a",
        toUserId: "user-b",
        amountCents: 500,
        deletedAt: "2026-11-14T00:00:00.000Z",
      }),
      entry({ id: "4", toUserId: "user-c", amountCents: 9999 }),
    ];

    expect(calculateFriendNetBalance(entries, "user-a", "user-b")).toBe(1750);
  });

  it("returns 0 without entries and rounds malformed amounts to integer cents", () => {
    expect(calculateFriendNetBalance([], "user-a", "user-b")).toBe(0);
    expect(
      calculateFriendNetBalance(
        [entry({ amountCents: 1000.4 })],
        "user-a",
        "user-b",
      ),
    ).toBe(1000);
    expect(
      calculateFriendNetBalance(
        [entry({ amountCents: Number.NaN })],
        "user-a",
        "user-b",
      ),
    ).toBe(0);
  });

  it("is symmetric with the opposite sign for the other viewer", () => {
    const entries = [
      entry({
        fromUserId: "user-a",
        toUserId: "user-b",
        amountCents: 900,
      }),
    ];

    expect(calculateFriendNetBalance(entries, "user-a", "user-b")).toBe(-900);
    expect(calculateFriendNetBalance(entries, "user-b", "user-a")).toBe(900);
  });
});

describe("centsToAmount", () => {
  it("converts integer cents to the decimal amount", () => {
    expect(centsToAmount(250)).toBe(2.5);
    expect(centsToAmount(-250)).toBe(-2.5);
    expect(centsToAmount(0)).toBe(0);
  });

  it("rounds malformed cents before dividing", () => {
    expect(centsToAmount(1000.4)).toBe(10);
    expect(centsToAmount(999.6)).toBe(10);
  });

  it("settles non-finite input at 0", () => {
    expect(centsToAmount(Number.NaN)).toBe(0);
    expect(centsToAmount(Number.POSITIVE_INFINITY)).toBe(0);
  });
});

describe("getFriendBalanceDirection", () => {
  it("maps the sign to a direction", () => {
    expect(getFriendBalanceDirection(250)).toBe("friend-owes-viewer");
    expect(getFriendBalanceDirection(-250)).toBe("viewer-owes-friend");
    expect(getFriendBalanceDirection(0)).toBe("settled");
  });
});
