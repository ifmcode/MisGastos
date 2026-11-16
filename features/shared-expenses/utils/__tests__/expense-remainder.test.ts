import { describe, expect, it } from "@jest/globals";

import { distributeByRemainder, type ExactShare } from "../expense-remainder";

function share(overrides: Partial<ExactShare> = {}): ExactShare {
  return {
    userId: "user-a",
    floorCents: 50,
    remainder: 0,
    ...overrides,
  };
}

function sumShares(shares: readonly { shareCents: number }[]): number {
  return shares.reduce((total, item) => total + item.shareCents, 0);
}

describe("distributeByRemainder", () => {
  it("gives a leftover cent to the biggest remainder", () => {
    const shares = distributeByRemainder(100, [
      share({ userId: "user-a", floorCents: 20, remainder: 3 }),
      share({ userId: "user-b", floorCents: 79, remainder: 7 }),
    ]);

    expect(shares).toEqual([
      { userId: "user-a", shareCents: 20 },
      { userId: "user-b", shareCents: 80 },
    ]);
  });

  it("breaks remainder ties by userId ascending", () => {
    const shares = distributeByRemainder(100, [
      share({ userId: "user-c", floorCents: 33, remainder: 1 }),
      share({ userId: "user-a", floorCents: 33, remainder: 1 }),
      share({ userId: "user-b", floorCents: 33, remainder: 1 }),
    ]);

    expect(shares.map((item) => item.shareCents)).toEqual([34, 33, 33]);
    expect(shares.map((item) => item.userId)).toEqual([
      "user-a",
      "user-b",
      "user-c",
    ]);
    expect(sumShares(shares)).toBe(100);
  });

  it("never depends on the input order", () => {
    const ordered = distributeByRemainder(100, [
      share({ userId: "user-a", floorCents: 33, remainder: 1 }),
      share({ userId: "user-b", floorCents: 33, remainder: 1 }),
      share({ userId: "user-c", floorCents: 33, remainder: 1 }),
    ]);
    const reversed = distributeByRemainder(100, [
      share({ userId: "user-c", floorCents: 33, remainder: 1 }),
      share({ userId: "user-b", floorCents: 33, remainder: 1 }),
      share({ userId: "user-a", floorCents: 33, remainder: 1 }),
    ]);

    expect(reversed).toEqual(ordered);
  });

  it("keeps exact shares untouched when nothing is left over", () => {
    const shares = distributeByRemainder(1000, [
      share({ userId: "user-a", floorCents: 400, remainder: 0 }),
      share({ userId: "user-b", floorCents: 600, remainder: 0 }),
    ]);

    expect(shares).toEqual([
      { userId: "user-a", shareCents: 400 },
      { userId: "user-b", shareCents: 600 },
    ]);
  });

  it("carries the mode fields it receives", () => {
    const shares = distributeByRemainder(100, [
      share({ userId: "user-a", floorCents: 50, percentageBps: 5000 }),
      share({ userId: "user-b", floorCents: 50, weight: 2 }),
    ]);

    expect(shares).toEqual([
      { userId: "user-a", shareCents: 50, percentageBps: 5000 },
      { userId: "user-b", shareCents: 50, weight: 2 },
    ]);
  });

  it("returns an empty list for no participants", () => {
    expect(distributeByRemainder(0, [])).toEqual([]);
  });
});
