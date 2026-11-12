import { describe, expect, it } from "@jest/globals";

import {
  toTransactionFieldErrors,
  TransactionInput,
  TRANSACTION_CONCEPT_MAX_LENGTH,
  TRANSACTION_NOTES_MAX_LENGTH,
  validateTransactionInput,
} from "../transaction.schema";

const baseInput: TransactionInput = {
  type: "expense",
  amount: "25,50",
  currency: "EUR",
  walletId: "  wallet-1  ",
  categoryId: "category-1",
  concept: "  Supermercado  ",
  notes: "  Compra semanal  ",
  date: "12/11/2026",
};

function inputWith(overrides: Partial<TransactionInput>): TransactionInput {
  return { ...baseInput, ...overrides };
}

function getIssueCodes(input: TransactionInput): string[] {
  const result = validateTransactionInput(input);

  if (result.ok) throw new Error("Expected validation to fail");

  return result.error.map((issue) => issue.code);
}

describe("validateTransactionInput", () => {
  it("returns a normalized DTO for valid input", () => {
    const result = validateTransactionInput(baseInput);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value).toEqual({
      type: "expense",
      amount: 25.5,
      currency: "EUR",
      walletId: "wallet-1",
      categoryId: "category-1",
      concept: "Supermercado",
      notes: "Compra semanal",
      date: "2026-11-12",
    });
  });

  it("omits empty notes", () => {
    const result = validateTransactionInput(inputWith({ notes: "   " }));

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect("notes" in result.value).toBe(false);
  });

  it("rejects invalid types, amounts and currencies", () => {
    expect(getIssueCodes(inputWith({ type: "transfer" }))).toContain(
      "INVALID_TYPE",
    );
    for (const amount of ["0", "-5", "abc", "10,555"]) {
      expect(getIssueCodes(inputWith({ amount }))).toContain("INVALID_AMOUNT");
    }
    expect(getIssueCodes(inputWith({ currency: "BTC" }))).toContain(
      "INVALID_CURRENCY",
    );
  });

  it("requires a wallet and a concept", () => {
    expect(getIssueCodes(inputWith({ walletId: "   " }))).toContain(
      "WALLET_REQUIRED",
    );
    expect(getIssueCodes(inputWith({ concept: "   " }))).toContain(
      "CONCEPT_REQUIRED",
    );
  });

  it("rejects long concepts and notes", () => {
    expect(
      getIssueCodes(
        inputWith({ concept: "a".repeat(TRANSACTION_CONCEPT_MAX_LENGTH + 1) }),
      ),
    ).toContain("CONCEPT_TOO_LONG");
    expect(
      getIssueCodes(
        inputWith({ notes: "a".repeat(TRANSACTION_NOTES_MAX_LENGTH + 1) }),
      ),
    ).toContain("NOTES_TOO_LONG");
  });

  it("rejects invalid dates", () => {
    expect(getIssueCodes(inputWith({ date: "31/02/2026" }))).toContain(
      "INVALID_DATE",
    );
  });

  it("collects every field issue in display order", () => {
    expect(
      getIssueCodes(
        inputWith({
          type: "transfer",
          amount: "0",
          currency: "BTC",
          walletId: "",
          categoryId: "",
          concept: "",
          notes: "a".repeat(TRANSACTION_NOTES_MAX_LENGTH + 1),
          date: "bad",
        }),
      ),
    ).toEqual([
      "INVALID_TYPE",
      "INVALID_AMOUNT",
      "INVALID_CURRENCY",
      "WALLET_REQUIRED",
      "INVALID_CATEGORY",
      "CONCEPT_REQUIRED",
      "NOTES_TOO_LONG",
      "INVALID_DATE",
    ]);
  });
});

describe("toTransactionFieldErrors", () => {
  it("keeps the first message per field", () => {
    expect(
      toTransactionFieldErrors([
        { field: "amount", code: "INVALID_AMOUNT", message: "Primero" },
        { field: "amount", code: "INVALID_AMOUNT", message: "Segundo" },
        { field: "concept", code: "CONCEPT_REQUIRED", message: "Concepto" },
      ]),
    ).toEqual({ amount: "Primero", concept: "Concepto" });
  });
});
