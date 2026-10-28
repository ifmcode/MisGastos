import { describe, expect, it } from "@jest/globals";

import {
  parseAmountInput,
  toWalletFieldErrors,
  validateWalletInput,
  WalletInput,
  WalletValidationIssue,
  WALLET_DESCRIPTION_MAX_LENGTH,
  WALLET_NAME_MAX_LENGTH,
} from "../wallet.schema";

const baseInput: WalletInput = {
  name: "Cuenta principal",
  currency: "EUR",
  icon: "wallet",
  color: "#0a7ea4",
  initialBalance: "1500,50",
  type: "bank",
  includeInTotal: true,
  description: "  Nómina y gastos fijos  ",
};

function inputWith(overrides: Record<string, unknown>): WalletInput {
  return { ...baseInput, ...overrides } as unknown as WalletInput;
}

function getIssues(input: WalletInput): WalletValidationIssue[] {
  const result = validateWalletInput(input);

  if (result.ok) {
    throw new Error("Expected wallet validation to fail");
  }

  return result.error;
}

describe("validateWalletInput", () => {
  it("returns a normalized DTO for valid input", () => {
    const result = validateWalletInput({
      ...baseInput,
      name: "  Cuenta principal  ",
      description: "  Nómina y gastos fijos  ",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value).toEqual({
      name: "Cuenta principal",
      currency: "EUR",
      icon: "wallet",
      color: "#0A7EA4",
      initialBalance: 1500.5,
      type: "bank",
      includeInTotal: true,
      description: "Nómina y gastos fijos",
    });
  });

  it("treats an empty initial balance as zero", () => {
    const result = validateWalletInput(
      inputWith({ initialBalance: "   " }),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.initialBalance).toBe(0);
  });

  it("rounds numeric amounts to two decimals", () => {
    const result = validateWalletInput(
      inputWith({ initialBalance: 12.345 }),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.initialBalance).toBe(12.35);
  });

  it("omits an empty optional description", () => {
    const result = validateWalletInput(
      inputWith({ description: "   " }),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect("description" in result.value).toBe(false);
  });

  it("requires a name and enforces its maximum length", () => {
    expect(getIssues(inputWith({ name: "   " }))).toEqual([
      expect.objectContaining({ field: "name", code: "NAME_REQUIRED" }),
    ]);

    expect(
      getIssues(
        inputWith({ name: "a".repeat(WALLET_NAME_MAX_LENGTH + 1) }),
      ),
    ).toEqual([
      expect.objectContaining({ field: "name", code: "NAME_TOO_LONG" }),
    ]);
  });

  it("rejects unsupported currencies, icons, colors and types", () => {
    const issues = getIssues(
      inputWith({
        currency: "BTC",
        icon: "rocket",
        color: "blue",
        type: "credit",
      }),
    );

    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: "currency", code: "INVALID_CURRENCY" }),
        expect.objectContaining({ field: "icon", code: "INVALID_ICON" }),
        expect.objectContaining({ field: "color", code: "INVALID_COLOR" }),
        expect.objectContaining({ field: "type", code: "INVALID_TYPE" }),
      ]),
    );
  });

  it("rejects negative initial balances", () => {
    expect(
      getIssues(inputWith({ initialBalance: -10 })),
    ).toEqual([
      expect.objectContaining({
        field: "initialBalance",
        code: "NEGATIVE_AMOUNT",
      }),
    ]);

    expect(
      getIssues(inputWith({ initialBalance: "-10,50" })),
    ).toEqual([
      expect.objectContaining({
        field: "initialBalance",
        code: "NEGATIVE_AMOUNT",
      }),
    ]);
  });

  it("rejects malformed initial balances", () => {
    const invalidValues = ["abc", "10,555", "1.234,56", "1e3", ".5"];

    for (const initialBalance of invalidValues) {
      expect(getIssues(inputWith({ initialBalance }))).toEqual([
        expect.objectContaining({
          field: "initialBalance",
          code: "INVALID_AMOUNT",
        }),
      ]);
    }
  });

  it("rejects a non-boolean includeInTotal flag", () => {
    expect(
      getIssues(inputWith({ includeInTotal: null })),
    ).toEqual([
      expect.objectContaining({
        field: "includeInTotal",
        code: "INVALID_INCLUDE_IN_TOTAL",
      }),
    ]);
  });

  it("rejects descriptions over the maximum length", () => {
    expect(
      getIssues(
        inputWith({
          description: "a".repeat(WALLET_DESCRIPTION_MAX_LENGTH + 1),
        }),
      ),
    ).toEqual([
      expect.objectContaining({
        field: "description",
        code: "DESCRIPTION_TOO_LONG",
      }),
    ]);
  });
});

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
