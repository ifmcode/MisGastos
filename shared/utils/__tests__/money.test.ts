import { describe, expect, it } from "@jest/globals";

import { roundMoney } from "../money";

describe("roundMoney", () => {
  it("rounds to two decimals", () => {
    expect(roundMoney(1.005)).toBe(1.01);
    expect(roundMoney(0.1 + 0.2)).toBe(0.3);
    expect(roundMoney(-1.234)).toBe(-1.23);
  });

  it("is idempotent and normalizes non-finite values", () => {
    expect(roundMoney(roundMoney(1.005))).toBe(1.01);
    expect(roundMoney(Number.NaN)).toBe(0);
    expect(roundMoney(Number.POSITIVE_INFINITY)).toBe(0);
    expect(roundMoney(-0.001)).toBeCloseTo(0);
  });
});
