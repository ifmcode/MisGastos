import { describe, expect, it } from "@jest/globals";

import { normalizeParticipants } from "../expense-split-modes";
import { splitExpenseAmount } from "../expense-split";
import { row } from "./expense-split.test-helpers";

const SINGLE = [row("user-a", 0)];
const GROUP_OPTIONS = { minParticipants: 1 };

describe("normalizeParticipants minParticipants", () => {
  it("keeps the 1:1 default of two participants", () => {
    expect(normalizeParticipants(SINGLE)).toBeNull();
    expect(normalizeParticipants([row("user-a", 0), row("user-b", 0)])).toEqual([
      { userId: "user-a", value: 0 },
      { userId: "user-b", value: 0 },
    ]);
  });

  it("accepts a single participant only with the explicit opt-in", () => {
    expect(normalizeParticipants(SINGLE, 1)).toEqual([
      { userId: "user-a", value: 0 },
    ]);
    expect(normalizeParticipants([], 1)).toBeNull();
  });

  it("clamps a minimum below one instead of dividing by zero", () => {
    expect(normalizeParticipants(SINGLE, 0)).toEqual([
      { userId: "user-a", value: 0 },
    ]);
    expect(normalizeParticipants([], 0)).toBeNull();
  });
});

describe("splitExpenseAmount with minParticipants", () => {
  it("still rejects a single participant by default", () => {
    const modes = ["equal", "percentage", "fixed", "shares"] as const;

    for (const mode of modes) {
      expect(splitExpenseAmount(1000, mode, SINGLE)).toEqual({
        ok: false,
        error: "INVALID_PARTICIPANTS",
      });
    }
  });

  it("hands the full amount to the only participant on an equal split", () => {
    expect(
      splitExpenseAmount(1000, "equal", SINGLE, GROUP_OPTIONS),
    ).toEqual({
      ok: true,
      value: [{ userId: "user-a", shareCents: 1000 }],
    });
  });

  it("needs the only fixed amount to match the total", () => {
    expect(
      splitExpenseAmount(1000, "fixed", [row("user-a", 1000)], GROUP_OPTIONS),
    ).toEqual({
      ok: true,
      value: [{ userId: "user-a", shareCents: 1000 }],
    });
    expect(
      splitExpenseAmount(1000, "fixed", [row("user-a", 600)], GROUP_OPTIONS),
    ).toEqual({ ok: false, error: "FIXED_SUM_MISMATCH" });
  });

  it("needs the only percentage to be 100%", () => {
    expect(
      splitExpenseAmount(
        1000,
        "percentage",
        [row("user-a", 10000)],
        GROUP_OPTIONS,
      ),
    ).toEqual({
      ok: true,
      value: [{ userId: "user-a", shareCents: 1000, percentageBps: 10000 }],
    });
    expect(
      splitExpenseAmount(
        1000,
        "percentage",
        [row("user-a", 5000)],
        GROUP_OPTIONS,
      ),
    ).toEqual({ ok: false, error: "PERCENTAGE_SUM_MISMATCH" });
  });

  it("gives the whole expense to the only positive share weight", () => {
    expect(
      splitExpenseAmount(1000, "shares", [row("user-a", 3)], GROUP_OPTIONS),
    ).toEqual({
      ok: true,
      value: [{ userId: "user-a", shareCents: 1000, weight: 3 }],
    });
    expect(
      splitExpenseAmount(1000, "shares", [row("user-a", 0)], GROUP_OPTIONS),
    ).toEqual({ ok: false, error: "SHARES_SUM_INVALID" });
  });
});
