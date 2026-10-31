import { describe, expect, it } from "@jest/globals";

import {
  toTransferFieldErrors,
  TransferInput,
  TransferValidationIssue,
  TRANSFER_NOTES_MAX_LENGTH,
  validateTransferInput,
} from "../transfer.schema";

const baseInput: TransferInput = {
  fromWalletId: "  wallet-1  ",
  toWalletId: "  wallet-2  ",
  amount: "50,25",
  currency: "EUR",
  notes: "  Ahorro mensual  ",
  date: "29/10/2026",
};

function inputWith(overrides: Record<string, unknown>): TransferInput {
  return { ...baseInput, ...overrides } as unknown as TransferInput;
}

function getIssues(input: TransferInput): TransferValidationIssue[] {
  const result = validateTransferInput(input);

  if (result.ok) {
    throw new Error("Expected transfer validation to fail");
  }

  return result.error;
}

describe("validateTransferInput", () => {
  it("returns a normalized DTO for valid input", () => {
    const result = validateTransferInput(baseInput);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value).toEqual({
      fromWalletId: "wallet-1",
      toWalletId: "wallet-2",
      amount: 50.25,
      currency: "EUR",
      notes: "Ahorro mensual",
      date: "2026-10-29",
    });
  });

  it("omits empty notes", () => {
    const result = validateTransferInput(inputWith({ notes: "   " }));

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect("notes" in result.value).toBe(false);
  });

  it("requires both wallets", () => {
    const issues = getIssues(
      inputWith({ fromWalletId: "  ", toWalletId: "" }),
    );

    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "fromWalletId",
          code: "FROM_WALLET_REQUIRED",
        }),
        expect.objectContaining({
          field: "toWalletId",
          code: "TO_WALLET_REQUIRED",
        }),
      ]),
    );
  });

  it("does not allow the same wallet as source and destination", () => {
    expect(
      getIssues(inputWith({ toWalletId: "wallet-1" })),
    ).toEqual([
      expect.objectContaining({
        field: "toWalletId",
        code: "SAME_WALLET",
      }),
    ]);
  });

  it("rejects zero, negative and malformed amounts", () => {
    for (const amount of ["0", "", "-5", "abc", "10,555"]) {
      expect(getIssues(inputWith({ amount }))).toEqual([
        expect.objectContaining({
          field: "amount",
          code: "INVALID_AMOUNT",
        }),
      ]);
    }
  });

  it("rejects unsupported currencies", () => {
    expect(getIssues(inputWith({ currency: "BTC" }))).toEqual([
      expect.objectContaining({
        field: "currency",
        code: "INVALID_CURRENCY",
      }),
    ]);
  });

  it("rejects notes over the maximum length", () => {
    expect(
      getIssues(
        inputWith({ notes: "a".repeat(TRANSFER_NOTES_MAX_LENGTH + 1) }),
      ),
    ).toEqual([
      expect.objectContaining({
        field: "notes",
        code: "NOTES_TOO_LONG",
      }),
    ]);
  });

  it("rejects invalid dates", () => {
    expect(getIssues(inputWith({ date: "31/02/2026" }))).toEqual([
      expect.objectContaining({
        field: "date",
        code: "INVALID_DATE",
      }),
    ]);
  });
});

describe("toTransferFieldErrors", () => {
  it("keeps the first message per field", () => {
    const errors = toTransferFieldErrors([
      { field: "amount", code: "INVALID_AMOUNT", message: "Primero" },
      { field: "amount", code: "INVALID_AMOUNT", message: "Segundo" },
      {
        field: "toWalletId",
        code: "SAME_WALLET",
        message: "Misma cartera",
      },
    ]);

    expect(errors).toEqual({
      amount: "Primero",
      toWalletId: "Misma cartera",
    });
  });
});
