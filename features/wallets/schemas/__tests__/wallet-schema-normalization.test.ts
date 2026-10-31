import { describe, expect, it } from "@jest/globals";

import { validateWalletInput } from "../wallet.schema";
import { baseInput, inputWith } from "./wallet-schema.test-helpers";

describe("validateWalletInput normalization", () => {
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
    const result = validateWalletInput(inputWith({ initialBalance: "   " }));

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.initialBalance).toBe(0);
  });

  it("rounds numeric amounts to two decimals", () => {
    const result = validateWalletInput(inputWith({ initialBalance: 12.345 }));

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.initialBalance).toBe(12.35);
  });

  it("omits an empty optional description", () => {
    const result = validateWalletInput(inputWith({ description: "   " }));

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect("description" in result.value).toBe(false);
  });
});
