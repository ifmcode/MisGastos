import { describe, expect, it } from "@jest/globals";

import type { ExpenseSplitMode } from "../../types/shared-expense.types";
import { splitExpenseAmount } from "../expense-split";
import { PAIR, row, sharesOf } from "./expense-split.test-helpers";

describe("splitExpenseAmount - fixed", () => {
  it("keeps the given fixed amounts", () => {
    expect(
      splitExpenseAmount(1000, "fixed", [row("user-b", 650), row("user-a", 350)]),
    ).toEqual({
      ok: true,
      value: [
        { userId: "user-a", shareCents: 350 },
        { userId: "user-b", shareCents: 650 },
      ],
    });
  });

  it("allows a zero-share participant", () => {
    const result = splitExpenseAmount(1000, "fixed", [
      row("user-a", 0),
      row("user-b", 1000),
    ]);

    expect(sharesOf(result)).toEqual([0, 1000]);
  });

  it("rejects a fixed sum that does not match the total", () => {
    expect(
      splitExpenseAmount(1000, "fixed", [
        row("user-a", 400),
        row("user-b", 500),
      ]),
    ).toEqual({ ok: false, error: "FIXED_SUM_MISMATCH" });
  });

  it("rejects negative or decimal fixed amounts", () => {
    expect(
      splitExpenseAmount(1000, "fixed", [
        row("user-a", -1),
        row("user-b", 1001),
      ]),
    ).toEqual({ ok: false, error: "INVALID_FIXED_AMOUNT" });
    expect(
      splitExpenseAmount(1000, "fixed", [
        row("user-a", 400.5),
        row("user-b", 599.5),
      ]),
    ).toEqual({ ok: false, error: "INVALID_FIXED_AMOUNT" });
  });
});

describe("splitExpenseAmount - shares", () => {
  it("splits by weight and gives the remainder to the biggest fraction", () => {
    const result = splitExpenseAmount(1000, "shares", [
      row("user-a", 1),
      row("user-b", 2),
    ]);

    expect(result.ok).toBe(true);
    expect(sharesOf(result)).toEqual([333, 667]);
  });

  it("accepts a zero-weight participant without giving it any cents", () => {
    expect(
      splitExpenseAmount(100, "shares", [row("user-a", 0), row("user-b", 3)]),
    ).toEqual({
      ok: true,
      value: [
        { userId: "user-a", shareCents: 0, weight: 0 },
        { userId: "user-b", shareCents: 100, weight: 3 },
      ],
    });
  });

  it("rejects all-zero weights", () => {
    expect(
      splitExpenseAmount(100, "shares", [row("user-a", 0), row("user-b", 0)]),
    ).toEqual({ ok: false, error: "SHARES_SUM_INVALID" });
  });

  it("rejects negative, decimal or non-finite weights", () => {
    const cases = [
      [row("user-a", -2), row("user-b", 4)],
      [row("user-a", 1.5), row("user-b", 2)],
      [row("user-a", Number.NaN), row("user-b", 2)],
    ];

    for (const participants of cases) {
      expect(splitExpenseAmount(100, "shares", participants)).toEqual({
        ok: false,
        error: "INVALID_SHARES",
      });
    }
  });
});

describe("splitExpenseAmount - guards", () => {
  it("rejects a non-positive or non-integer total", () => {
    for (const total of [0, -100, 12.5, Number.NaN]) {
      expect(splitExpenseAmount(total, "equal", PAIR)).toEqual({
        ok: false,
        error: "INVALID_TOTAL",
      });
    }
  });

  it("rejects fewer than two, duplicate or empty participants", () => {
    expect(splitExpenseAmount(100, "equal", [row("user-a", 0)])).toEqual({
      ok: false,
      error: "INVALID_PARTICIPANTS",
    });
    expect(
      splitExpenseAmount(100, "equal", [row("user-a", 0), row("user-a", 0)]),
    ).toEqual({ ok: false, error: "INVALID_PARTICIPANTS" });
    expect(
      splitExpenseAmount(100, "equal", [row("user-a", 0), row("  ", 0)]),
    ).toEqual({ ok: false, error: "INVALID_PARTICIPANTS" });
    expect(
      splitExpenseAmount(100, "equal", [
        { userId: 7 as unknown as string, value: 0 },
        row("user-b", 0),
      ]),
    ).toEqual({ ok: false, error: "INVALID_PARTICIPANTS" });
  });

  it("rejects an unknown mode", () => {
    expect(splitExpenseAmount(100, "ratio" as ExpenseSplitMode, PAIR)).toEqual({
      ok: false,
      error: "INVALID_PARTICIPANTS",
    });
  });
});
