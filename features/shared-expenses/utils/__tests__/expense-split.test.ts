import { describe, expect, it } from "@jest/globals";

import { isExpenseSplitMode, splitExpenseAmount } from "../expense-split";
import { idsOf, PAIR, row, sharesOf, sumCents } from "./expense-split.test-helpers";

describe("splitExpenseAmount - equal", () => {
  it("splits an even amount exactly", () => {
    expect(splitExpenseAmount(500, "equal", PAIR)).toEqual({
      ok: true,
      value: [
        { userId: "user-a", shareCents: 250 },
        { userId: "user-b", shareCents: 250 },
      ],
    });
  });

  it("gives the odd cent to the lowest userId and keeps the total", () => {
    expect(splitExpenseAmount(1, "equal", PAIR)).toEqual({
      ok: true,
      value: [
        { userId: "user-a", shareCents: 1 },
        { userId: "user-b", shareCents: 0 },
      ],
    });
  });

  it("handles 100 over 3 participants", () => {
    const result = splitExpenseAmount(100, "equal", [
      row("user-c", 0),
      row("user-b", 0),
      row("user-a", 0),
    ]);

    expect(sharesOf(result)).toEqual([34, 33, 33]);
    expect(sumCents(result)).toBe(100);
  });

  it("ignores the raw equal values and trims the ids", () => {
    const result = splitExpenseAmount(100, "equal", [
      row(" user-b ", 900),
      row(" user-a ", 7),
    ]);

    expect(sharesOf(result)).toEqual([50, 50]);
    expect(idsOf(result)).toEqual(["user-a", "user-b"]);
    expect(sumCents(result)).toBe(100);
  });
});

describe("splitExpenseAmount - percentage", () => {
  it("splits by basis points and keeps the total", () => {
    expect(
      splitExpenseAmount(1000, "percentage", [
        row("user-a", 6000),
        row("user-b", 4000),
      ]),
    ).toEqual({
      ok: true,
      value: [
        { userId: "user-a", shareCents: 600, percentageBps: 6000 },
        { userId: "user-b", shareCents: 400, percentageBps: 4000 },
      ],
    });
  });

  it("resolves 50/50 of an odd amount with the largest remainder", () => {
    const result = splitExpenseAmount(999, "percentage", [
      row("user-a", 5000),
      row("user-b", 5000),
    ]);

    expect(sharesOf(result)).toEqual([500, 499]);
    expect(sumCents(result)).toBe(999);
  });

  it("distributes a 100/3 style remainder", () => {
    const result = splitExpenseAmount(100, "percentage", [
      row("user-a", 3334),
      row("user-b", 3333),
      row("user-c", 3333),
    ]);

    expect(sharesOf(result)).toEqual([34, 33, 33]);
    expect(sumCents(result)).toBe(100);
  });

  it("rejects a percentage sum that is not 100%", () => {
    expect(
      splitExpenseAmount(1000, "percentage", [
        row("user-a", 3000),
        row("user-b", 3000),
      ]),
    ).toEqual({ ok: false, error: "PERCENTAGE_SUM_MISMATCH" });
  });

  it("assigns everything to the 100% participant and nothing to the 0% one", () => {
    expect(
      splitExpenseAmount(1000, "percentage", [
        row("user-a", 0),
        row("user-b", 10000),
      ]),
    ).toEqual({
      ok: true,
      value: [
        { userId: "user-a", shareCents: 0, percentageBps: 0 },
        { userId: "user-b", shareCents: 1000, percentageBps: 10000 },
      ],
    });
  });

  it("rejects negative, decimal or oversized basis points", () => {
    const cases = [
      [row("user-a", -1000), row("user-b", 11000)],
      [row("user-a", 5000.5), row("user-b", 4999.5)],
      [row("user-a", 10001), row("user-b", 10000)],
    ];

    for (const participants of cases) {
      expect(splitExpenseAmount(100, "percentage", participants)).toEqual({
        ok: false,
        error: "INVALID_PERCENTAGE",
      });
    }
  });
});

describe("isExpenseSplitMode", () => {
  it("accepts the four supported modes", () => {
    expect(
      ["equal", "percentage", "fixed", "shares"].every(isExpenseSplitMode),
    ).toBe(true);
  });

  it("rejects anything else", () => {
    expect(isExpenseSplitMode("EQUAL")).toBe(false);
    expect(isExpenseSplitMode("")).toBe(false);
    expect(isExpenseSplitMode(null)).toBe(false);
    expect(isExpenseSplitMode(3)).toBe(false);
  });
});
