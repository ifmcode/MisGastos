import { describe, expect, it } from "@jest/globals";

import { formatCurrency } from "@/shared/utils/format";

import {
  formatRemainingCents,
  getFixedSplitRemaining,
} from "../expense-remaining";

describe("getFixedSplitRemaining", () => {
  it("reports nothing allocated when the form is empty", () => {
    expect(getFixedSplitRemaining("", ["", ""])).toEqual({
      totalCents: 0,
      assignedCents: 0,
      missingCents: 0,
      excessCents: 0,
      state: "complete",
    });
  });

  it("reports the missing amount of a partial split", () => {
    expect(getFixedSplitRemaining("100", ["75", ""])).toEqual({
      totalCents: 10000,
      assignedCents: 7500,
      missingCents: 2500,
      excessCents: 0,
      state: "partial",
    });
  });

  it("is complete when the shares match the total exactly", () => {
    expect(getFixedSplitRemaining("100,00", ["50", "50.00"])).toMatchObject({
      totalCents: 10000,
      assignedCents: 10000,
      missingCents: 0,
      excessCents: 0,
      state: "complete",
    });
  });

  it("reports the excess when the shares exceed the total", () => {
    expect(getFixedSplitRemaining("100", ["80", "30"])).toEqual({
      totalCents: 10000,
      assignedCents: 11000,
      missingCents: 0,
      excessCents: 1000,
      state: "over",
    });
  });

  it("keeps decimals exact in integer cents", () => {
    const result = getFixedSplitRemaining("66,66", ["33,33", "33.33"]);

    expect(result.totalCents).toBe(6666);
    expect(result.assignedCents).toBe(6666);
    expect(result.state).toBe("complete");
  });

  it("counts a comma decimal and a thousands-free large amount", () => {
    const result = getFixedSplitRemaining("1234,56", ["1000", "234,56"]);

    expect(result.totalCents).toBe(123456);
    expect(result.assignedCents).toBe(123456);
    expect(result.state).toBe("complete");
  });

  it("treats empty or unparseable inputs as zero", () => {
    expect(getFixedSplitRemaining("50", ["", "abc", "-3"])).toMatchObject({
      totalCents: 5000,
      assignedCents: 0,
      missingCents: 5000,
      state: "partial",
    });
  });

  it("treats an invalid amount as zero and reports no remaining", () => {
    expect(getFixedSplitRemaining("abc", ["10"])).toMatchObject({
      totalCents: 0,
      assignedCents: 1000,
      excessCents: 1000,
      state: "over",
    });
  });
});

describe("formatRemainingCents", () => {
  it("formats decimals with the app locale", () => {
    expect(formatRemainingCents(3333, "EUR", "es-ES")).toBe(
      formatCurrency(33.33, "EUR", "es-ES"),
    );
    expect(formatRemainingCents(3333, "EUR", "es-ES")).toContain("33,33");
  });

  it("groups thousands with the app locale", () => {
    const formatted = formatRemainingCents(12345678, "EUR", "es-ES");

    expect(formatted).toBe(formatCurrency(123456.78, "EUR", "es-ES"));
    expect(formatted).toContain("123.456,78");
  });

  it("keeps four-digit amounts ungrouped in Spanish, as Intl does", () => {
    expect(formatRemainingCents(123456, "EUR", "es-ES")).toBe(
      formatCurrency(1234.56, "EUR", "es-ES"),
    );
  });

  it("uses the currency symbol of the expense", () => {
    expect(formatRemainingCents(1000, "USD", "es-ES")).toContain("$");
    expect(formatRemainingCents(1000, "EUR", "es-ES")).toContain("€");
  });

  it("never renders NaN for a non-finite amount", () => {
    expect(formatRemainingCents(Number.NaN, "EUR", "es-ES")).toContain("0,00");
  });
});
