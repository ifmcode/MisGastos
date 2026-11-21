import { describe, expect, it } from "@jest/globals";

import {
  switchGroupExpenseSplitMode,
  updateGroupExpenseAmount,
  updateGroupSplitValueText,
} from "../group-expense-form-modes";
import { buildFormValues } from "./group-expense-ui.test-helpers";

describe("updateGroupExpenseAmount", () => {
  it("derives the fixed defaults from the new amount", () => {
    const values = updateGroupExpenseAmount(buildFormValues(), "10.00");

    expect(values.amount).toBe("10.00");
    expect(values.splitValues.fixed).toEqual({
      "user-a": "3.34",
      "user-b": "3.33",
      "user-c": "3.33",
    });
  });

  it("refreshes fixed defaults already derived from the previous amount", () => {
    const first = updateGroupExpenseAmount(buildFormValues(), "10.00");
    const second = updateGroupExpenseAmount(first, "3.00");

    expect(second.splitValues.fixed).toEqual({
      "user-a": "1.00",
      "user-b": "1.00",
      "user-c": "1.00",
    });
  });

  it("keeps a fixed row the user typed", () => {
    const typed = buildFormValues({
      amount: "10.00",
      splitValues: {
        equal: {},
        percentage: {},
        fixed: { "user-a": "5.00", "user-b": "5.00", "user-c": "0.00" },
        shares: {},
      },
    });

    const values = updateGroupExpenseAmount(typed, "12.00");

    expect(values.splitValues.fixed).toEqual(typed.splitValues.fixed);
  });

  it("keeps typed fixed rows that no longer match the total", () => {
    const typed = buildFormValues({
      amount: "10.00",
      splitValues: {
        equal: {},
        percentage: {},
        fixed: { "user-a": "4.00", "user-b": "4.00", "user-c": "4.00" },
        shares: {},
      },
    });

    expect(updateGroupExpenseAmount(typed, "9.00").splitValues.fixed).toEqual(
      typed.splitValues.fixed,
    );
  });

  it("writes the amount even without participants selected", () => {
    const values = updateGroupExpenseAmount(
      buildFormValues({ memberIds: [], participantIds: [] }),
      "10.00",
    );

    expect(values.amount).toBe("10.00");
    expect(values.splitValues.fixed).toEqual({});
  });
});

describe("switchGroupExpenseSplitMode", () => {
  it("keeps the same state when the mode does not change", () => {
    const values = buildFormValues();

    expect(switchGroupExpenseSplitMode(values, "equal")).toBe(values);
  });

  it("generates defaults of the target mode from the amount", () => {
    const values = switchGroupExpenseSplitMode(
      buildFormValues({ amount: "10.00" }),
      "percentage",
    );

    expect(values.splitMode).toBe("percentage");
    expect(values.splitValues.percentage).toEqual({
      "user-a": "33.34",
      "user-b": "33.33",
      "user-c": "33.33",
    });
  });

  it("reuses typed values of the target mode while they still add up", () => {
    const values = buildFormValues({
      amount: "10.00",
      splitValues: {
        equal: {},
        percentage: {},
        fixed: { "user-a": "4.00", "user-b": "3.00", "user-c": "3.00" },
        shares: {},
      },
    });

    const switched = switchGroupExpenseSplitMode(values, "fixed");

    expect(switched.splitValues.fixed).toEqual(values.splitValues.fixed);
  });

  it("regenerates values that no longer add up", () => {
    const values = buildFormValues({
      amount: "10.00",
      splitValues: {
        equal: {},
        percentage: {},
        fixed: { "user-a": "1.00", "user-b": "1.00", "user-c": "1.00" },
        shares: {},
      },
    });

    const switched = switchGroupExpenseSplitMode(values, "fixed");

    expect(switched.splitValues.fixed).toEqual({
      "user-a": "3.34",
      "user-b": "3.33",
      "user-c": "3.33",
    });
  });
});

describe("updateGroupSplitValueText", () => {
  it("writes only the active mode of the participant", () => {
    const values = updateGroupSplitValueText(
      buildFormValues({ splitMode: "fixed" }),
      "user-b",
      "12.50",
    );

    expect(values.splitValues.fixed).toEqual({ "user-b": "12.50" });
    expect(values.splitValues.percentage).toEqual({});
  });
});
