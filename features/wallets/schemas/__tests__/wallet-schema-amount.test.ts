import { describe, expect, it } from "@jest/globals";

import { parseAmountInput, toWalletFieldErrors } from "../wallet.schema";

describe("parseAmountInput", () => {
  it("accepts empty, integer, comma-decimal and dot-decimal values", () => {
    expect(parseAmountInput("")).toBe(0);
    expect(parseAmountInput("0")).toBe(0);
    expect(parseAmountInput("10")).toBe(10);
    expect(parseAmountInput("10,5")).toBe(10.5);
    expect(parseAmountInput("10.50")).toBe(10.5);
    expect(parseAmountInput(" 42 ")).toBe(42);
  });

  it("rejects negative, malformed and out-of-range values", () => {
    expect(parseAmountInput(-1)).toBeNull();
    expect(parseAmountInput("-1")).toBeNull();
    expect(parseAmountInput("1,234.56")).toBeNull();
    expect(parseAmountInput("1 000")).toBeNull();
    expect(parseAmountInput(Number.NaN)).toBeNull();
    expect(parseAmountInput(Number.POSITIVE_INFINITY)).toBeNull();
    expect(parseAmountInput(1_000_000_000_000)).toBeNull();
  });
});

describe("toWalletFieldErrors", () => {
  it("keeps the first message per field", () => {
    const errors = toWalletFieldErrors([
      { field: "name", code: "NAME_REQUIRED", message: "Primero" },
      { field: "name", code: "NAME_TOO_LONG", message: "Segundo" },
      { field: "color", code: "INVALID_COLOR", message: "Color" },
    ]);

    expect(errors).toEqual({ name: "Primero", color: "Color" });
  });
});
