import { describe, expect, it } from "@jest/globals";

import { getSettlementAmountState } from "../settlement-amount-status";

describe("getSettlementAmountState", () => {
  it("reports the debt left when the amount is under the debt", () => {
    expect(getSettlementAmountState("10.00", 1250)).toEqual({
      status: "remaining",
      remainingCents: 250,
    });
  });

  it("reports the debt as settled when the amount matches it", () => {
    expect(getSettlementAmountState("12.50", 1250)).toEqual({
      status: "settled",
      remainingCents: 0,
    });
  });

  it("reports an excess without a negative remaining amount", () => {
    expect(getSettlementAmountState("12.51", 1250)).toEqual({
      status: "exceeds",
      remainingCents: 0,
    });
  });

  it("accepts a comma decimal separator like the submit path", () => {
    expect(getSettlementAmountState("12,50", 1250)?.status).toBe("settled");
    expect(getSettlementAmountState("10,25", 1250)).toEqual({
      status: "remaining",
      remainingCents: 225,
    });
  });

  it("rounds the amount and the debt to integer cents", () => {
    expect(getSettlementAmountState("0.29", 29)?.status).toBe("settled");
    expect(getSettlementAmountState("12.50", 1250.4)?.status).toBe("settled");
    expect(getSettlementAmountState("0.29", 30)).toEqual({
      status: "remaining",
      remainingCents: 1,
    });
  });

  it("returns null for empty input", () => {
    expect(getSettlementAmountState("", 1250)).toBeNull();
    expect(getSettlementAmountState("   ", 1250)).toBeNull();
  });

  it("returns null for unparseable input", () => {
    expect(getSettlementAmountState("abc", 1250)).toBeNull();
    expect(getSettlementAmountState("12.345", 1250)).toBeNull();
    expect(getSettlementAmountState("-1", 1250)).toBeNull();
  });

  it("returns null for a zero amount", () => {
    expect(getSettlementAmountState("0", 1250)).toBeNull();
    expect(getSettlementAmountState("0,00", 1250)).toBeNull();
  });

  it("returns null when the debt is not a finite number", () => {
    expect(getSettlementAmountState("12.50", Number.NaN)).toBeNull();
    expect(getSettlementAmountState("12.50", Number.POSITIVE_INFINITY)).toBeNull();
  });

  it("treats a zero debt as an excess", () => {
    expect(getSettlementAmountState("1.00", 0)).toEqual({
      status: "exceeds",
      remainingCents: 0,
    });
  });
});
