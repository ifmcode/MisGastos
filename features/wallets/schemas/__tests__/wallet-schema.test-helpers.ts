import {
  validateWalletInput,
  WalletInput,
  WalletValidationIssue,
} from "../wallet.schema";

export const baseInput: WalletInput = {
  name: "Cuenta principal",
  currency: "EUR",
  icon: "wallet",
  color: "#0a7ea4",
  initialBalance: "1500,50",
  type: "bank",
  includeInTotal: true,
  description: "  Nómina y gastos fijos  ",
};

export function inputWith(overrides: Record<string, unknown>): WalletInput {
  return { ...baseInput, ...overrides } as unknown as WalletInput;
}

export function getIssues(input: WalletInput): WalletValidationIssue[] {
  const result = validateWalletInput(input);

  if (result.ok) {
    throw new Error("Expected wallet validation to fail");
  }

  return result.error;
}
