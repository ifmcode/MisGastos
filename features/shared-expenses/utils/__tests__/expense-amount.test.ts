import { describe, expect, it } from "@jest/globals";

import {
  amountToCents,
  centsToAmount,
  parseCentsAmount,
} from "../expense-amount";

describe("amountToCents", () => {
  it("converts a decimal amount into integer cents", () => {
    expect(amountToCents("12.34")).toBe(1234);
    expect(amountToCents(" 7 ")).toBe(700);
    expect(amountToCents(12.34)).toBe(1234);
    expect(amountToCents("0.01")).toBe(1);
  });

  it("accepts a comma as decimal separator", () => {
    expect(amountToCents("0,29")).toBe(29);
    expect(amountToCents("10,5")).toBe(1050);
  });

  it("absorbs float drift before rounding", () => {
    expect(amountToCents(0.29)).toBe(29);
    expect(amountToCents(1.15)).toBe(115);
    expect(amountToCents(0.1 + 0.2)).toBe(30);
  });

  it("rejects malformed, non-finite and non-numeric input", () => {
    expect(amountToCents("")).toBeNull();
    expect(amountToCents("   ")).toBeNull();
    expect(amountToCents("abc")).toBeNull();
    expect(amountToCents("1.234")).toBeNull();
    expect(amountToCents("1e3")).toBeNull();
    expect(amountToCents(Number.NaN)).toBeNull();
    expect(amountToCents(Number.POSITIVE_INFINITY)).toBeNull();
    expect(amountToCents(null)).toBeNull();
    expect(amountToCents(undefined)).toBeNull();
    expect(amountToCents({})).toBeNull();
  });

  it("rejects negatives and zero", () => {
    expect(amountToCents("-5")).toBeNull();
    expect(amountToCents(-5)).toBeNull();
    expect(amountToCents("0")).toBeNull();
    expect(amountToCents("0.00")).toBeNull();
    expect(amountToCents(0)).toBeNull();
  });
});

describe("parseCentsAmount", () => {
  it("keeps zero valid when the caller allows it", () => {
    expect(parseCentsAmount("0", true)).toBe(0);
    expect(parseCentsAmount("0.00", true)).toBe(0);
    expect(parseCentsAmount(0, true)).toBe(0);
  });

  it("rejects zero and malformed input when zero is not allowed", () => {
    expect(parseCentsAmount("0")).toBeNull();
    expect(parseCentsAmount("abc", true)).toBeNull();
    expect(parseCentsAmount(-1, true)).toBeNull();
  });
});

describe("centsToAmount", () => {
  it("converts integer cents into the rounded decimal amount", () => {
    expect(centsToAmount(1234)).toBe(12.34);
    expect(centsToAmount(1)).toBe(0.01);
    expect(centsToAmount(1000)).toBe(10);
    expect(centsToAmount(0)).toBe(0);
  });

  it("round-trips with amountToCents", () => {
    expect(amountToCents(centsToAmount(1234))).toBe(1234);
    expect(amountToCents(centsToAmount(29))).toBe(29);
  });

  it("returns zero for non-finite input", () => {
    expect(centsToAmount(Number.NaN)).toBe(0);
    expect(centsToAmount(Number.POSITIVE_INFINITY)).toBe(0);
  });
});
