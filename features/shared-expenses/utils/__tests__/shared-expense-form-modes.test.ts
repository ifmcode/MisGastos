import { describe, expect, it } from "@jest/globals";

import {
  createSharedExpenseFormValues,
  type SharedExpenseFormValues,
} from "../shared-expense-form";
import {
  refreshSplitValueDefaults,
  switchExpenseSplitMode,
  updateSplitValueText,
} from "../shared-expense-form-modes";

function buildValues(
  overrides: Partial<SharedExpenseFormValues> = {},
): SharedExpenseFormValues {
  return {
    ...createSharedExpenseFormValues({
      viewerUid: "user-a",
      friendUid: "user-b",
      currency: "EUR",
      date: "2026-11-10",
    }),
    ...overrides,
  };
}

describe("switchExpenseSplitMode", () => {
  it("prefills even percentages from the current amount", () => {
    const next = switchExpenseSplitMode(buildValues({ amount: "10" }), "percentage");

    expect(next.splitMode).toBe("percentage");
    expect(next.splitValues.percentage).toEqual({
      "user-a": "50",
      "user-b": "50",
    });
  });

  it("prefills fixed cents and share weights", () => {
    const fixed = switchExpenseSplitMode(buildValues({ amount: "10" }), "fixed");
    const shares = switchExpenseSplitMode(buildValues({ amount: "10" }), "shares");

    expect(fixed.splitValues.fixed).toEqual({
      "user-a": "5.00",
      "user-b": "5.00",
    });
    expect(shares.splitValues.shares).toEqual({
      "user-a": "1",
      "user-b": "1",
    });
  });

  it("keeps values the user already typed for a still valid mode", () => {
    const values = buildValues({
      amount: "10",
      splitMode: "equal",
      splitValues: {
        equal: {},
        percentage: { "user-a": "60", "user-b": "40" },
        fixed: {},
        shares: {},
      },
    });

    expect(switchExpenseSplitMode(values, "percentage").splitValues.percentage)
      .toEqual({ "user-a": "60", "user-b": "40" });
  });

  it("replaces values that no longer add up", () => {
    const values = buildValues({
      amount: "10",
      splitMode: "equal",
      splitValues: {
        equal: {},
        percentage: { "user-a": "60", "user-b": "30" },
        fixed: {},
        shares: {},
      },
    });

    expect(switchExpenseSplitMode(values, "percentage").splitValues.percentage)
      .toEqual({ "user-a": "50", "user-b": "50" });
  });

  it("returns the same values when the mode does not change", () => {
    const values = buildValues({ amount: "10", splitMode: "fixed" });

    expect(switchExpenseSplitMode(values, "fixed")).toBe(values);
  });
});

describe("refreshSplitValueDefaults", () => {
  it("keeps valid maps and rebuilds the stale ones", () => {
    const values = buildValues({
      amount: "10",
      splitValues: {
        equal: {},
        percentage: { "user-a": "50", "user-b": "50" },
        fixed: { "user-old": "10.00" },
        shares: { "user-a": "2", "user-b": "1" },
      },
    });
    const next = refreshSplitValueDefaults(values);

    expect(next.splitValues.percentage).toEqual({
      "user-a": "50",
      "user-b": "50",
    });
    expect(next.splitValues.fixed).toEqual({
      "user-a": "5.00",
      "user-b": "5.00",
    });
    expect(next.splitValues.shares).toEqual({
      "user-a": "2",
      "user-b": "1",
    });
  });

  it("rebuilds values keyed by a friend that is no longer selected", () => {
    const values = buildValues({
      amount: "10",
      splitValues: {
        equal: {},
        percentage: { "user-a": "50", "user-old": "50" },
        fixed: {},
        shares: {},
      },
    });

    expect(refreshSplitValueDefaults(values).splitValues.percentage).toEqual({
      "user-a": "50",
      "user-b": "50",
    });
  });
});

describe("updateSplitValueText", () => {
  it("writes only the active mode", () => {
    const values = buildValues({
      amount: "10",
      splitMode: "fixed",
      splitValues: {
        equal: {},
        percentage: {},
        fixed: { "user-a": "5.00", "user-b": "5.00" },
        shares: {},
      },
    });
    const next = updateSplitValueText(values, "user-a", "6,00");

    expect(next.splitValues.fixed).toEqual({
      "user-a": "6,00",
      "user-b": "5.00",
    });
    expect(next.splitValues.percentage).toEqual({});
  });
});
