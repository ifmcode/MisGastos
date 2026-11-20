import { describe, expect, it } from "@jest/globals";

import { formatCurrencyLabel } from "../currency-label";

describe("formatCurrencyLabel", () => {
  it("renders the code and symbol of a supported currency", () => {
    expect(formatCurrencyLabel("EUR")).toBe("EUR €");
    expect(formatCurrencyLabel("USD")).toBe("USD $");
    expect(formatCurrencyLabel("JPY")).toBe("JPY ¥");
  });

  it("keeps the raw code of an unknown currency", () => {
    expect(formatCurrencyLabel("BTC")).toBe("BTC");
    expect(formatCurrencyLabel("  ARS  ")).toBe("ARS");
  });

  it("falls back to the default currency when the value is missing", () => {
    expect(formatCurrencyLabel(null)).toBe("EUR €");
    expect(formatCurrencyLabel(undefined)).toBe("EUR €");
    expect(formatCurrencyLabel("")).toBe("EUR €");
    expect(formatCurrencyLabel("   ")).toBe("EUR €");
  });

  it("never throws for a non-string value", () => {
    expect(formatCurrencyLabel(42)).toBe("EUR €");
    expect(formatCurrencyLabel({})).toBe("EUR €");
  });
});
