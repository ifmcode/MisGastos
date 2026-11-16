import { describe, expect, it } from "@jest/globals";

import {
  createSharedExpenseFormValues,
  type SharedExpenseFormValues,
} from "../shared-expense-form";
import { updateAmountAndFixedSplit } from "../shared-expense-form-modes";

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

function withFixedSplit(
  amount: string,
  fixed: Record<string, string>,
): SharedExpenseFormValues {
  return buildValues({
    amount,
    splitMode: "fixed",
    splitValues: { equal: {}, percentage: {}, fixed, shares: {} },
  });
}

describe("updateAmountAndFixedSplit", () => {
  it("rebuilds the zero defaults when the total arrives after choosing Importe", () => {
    const values = withFixedSplit("", { "user-a": "0.00", "user-b": "0.00" });
    const next = updateAmountAndFixedSplit(values, "10");

    expect(next.amount).toBe("10");
    expect(next.splitValues.fixed).toEqual({
      "user-a": "5.00",
      "user-b": "5.00",
    });
  });

  it("follows a new total while the rows are still the derived defaults", () => {
    const values = withFixedSplit("10", { "user-a": "5.00", "user-b": "5.00" });

    expect(updateAmountAndFixedSplit(values, "20").splitValues.fixed).toEqual({
      "user-a": "10.00",
      "user-b": "10.00",
    });
  });

  it("rounds the regenerated defaults for an odd total", () => {
    const values = withFixedSplit("10", { "user-a": "5.00", "user-b": "5.00" });

    expect(updateAmountAndFixedSplit(values, "9.99").splitValues.fixed).toEqual({
      "user-a": "5.00",
      "user-b": "4.99",
    });
  });

  it("keeps a typed fixed split when the amount changes", () => {
    const values = withFixedSplit("10", { "user-a": "6.00", "user-b": "3.00" });
    const next = updateAmountAndFixedSplit(values, "20");

    expect(next.amount).toBe("20");
    expect(next.splitValues.fixed).toEqual({
      "user-a": "6.00",
      "user-b": "3.00",
    });
  });

  it("keeps typed rows that happen to split the previous amount", () => {
    const values = withFixedSplit("10", { "user-a": "6.00", "user-b": "4.00" });

    expect(updateAmountAndFixedSplit(values, "20").splitValues.fixed).toEqual({
      "user-a": "6.00",
      "user-b": "4.00",
    });
  });

  it("recognizes derived defaults written with another format", () => {
    const values = withFixedSplit("10", { "user-a": "5", "user-b": "5,00" });

    expect(updateAmountAndFixedSplit(values, "20").splitValues.fixed).toEqual({
      "user-a": "10.00",
      "user-b": "10.00",
    });
  });

  it("regenerates empty rows when there was no previous amount", () => {
    const values = withFixedSplit("", { "user-a": "", "user-b": "" });

    expect(updateAmountAndFixedSplit(values, "8").splitValues.fixed).toEqual({
      "user-a": "4.00",
      "user-b": "4.00",
    });
  });

  it("treats an unparsable previous amount as no amount", () => {
    const values = withFixedSplit("abc", { "user-a": "0", "user-b": "0" });

    expect(updateAmountAndFixedSplit(values, "8").splitValues.fixed).toEqual({
      "user-a": "4.00",
      "user-b": "4.00",
    });
  });

  it("leaves percentage and shares untouched because they ignore the total", () => {
    const values = buildValues({
      amount: "10",
      splitMode: "fixed",
      splitValues: {
        equal: {},
        percentage: { "user-a": "60", "user-b": "40" },
        fixed: { "user-a": "5.00", "user-b": "5.00" },
        shares: { "user-a": "2", "user-b": "1" },
      },
    });
    const next = updateAmountAndFixedSplit(values, "20");

    expect(next.splitValues.percentage).toEqual({
      "user-a": "60",
      "user-b": "40",
    });
    expect(next.splitValues.shares).toEqual({ "user-a": "2", "user-b": "1" });
    expect(next.splitValues.fixed).toEqual({
      "user-a": "10.00",
      "user-b": "10.00",
    });
  });
});
