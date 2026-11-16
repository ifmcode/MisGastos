import { describe, expect, it } from "@jest/globals";

import {
  getSharedExpenseErrorCode,
  SharedExpenseOperationError,
  SharedExpenseValidationError,
} from "../shared-expense.errors";

function firebaseError(code: string, message = "boom"): Error {
  const error = new Error(message);
  (error as { code?: string }).code = code;

  return error;
}

describe("SharedExpenseValidationError", () => {
  it("keeps the issues and the first code per field", () => {
    const error = new SharedExpenseValidationError([
      { field: "amount", code: "AMOUNT_INVALID" },
      { field: "participants", code: "PARTICIPANTS_INVALID" },
    ]);

    expect(error.name).toBe("SharedExpenseValidationError");
    expect(error.message).toBe("AMOUNT_INVALID");
    expect(error.fieldErrors).toEqual({
      amount: "AMOUNT_INVALID",
      participants: "PARTICIPANTS_INVALID",
    });
  });

  it("falls back to VALIDATION without issues", () => {
    const error = new SharedExpenseValidationError([]);

    expect(error.message).toBe("VALIDATION");
    expect(error.fieldErrors).toEqual({});
  });
});

describe("getSharedExpenseErrorCode", () => {
  it("maps validation errors", () => {
    const error = new SharedExpenseValidationError([
      { field: "date", code: "DATE_INVALID" },
    ]);

    expect(getSharedExpenseErrorCode(error)).toBe("VALIDATION");
  });

  it("keeps the operation codes", () => {
    const codes = [
      "SIGN_IN_REQUIRED",
      "EXPENSE_NOT_FOUND",
      "NOT_PARTICIPANT",
      "NOT_FRIEND",
      "ALREADY_DELETED",
      "INSUFFICIENT_BALANCE",
      "WALLET_NOT_FOUND",
      "WALLET_NOT_OWNED",
      "CURRENCY_MISMATCH",
    ] as const;

    for (const code of codes) {
      const error = new SharedExpenseOperationError(code);

      expect(error.name).toBe("SharedExpenseOperationError");
      expect(error.code).toBe(code);
      expect(getSharedExpenseErrorCode(error)).toBe(code);
    }
  });

  it("maps Firestore codes", () => {
    expect(getSharedExpenseErrorCode(firebaseError("permission-denied"))).toBe(
      "PERMISSION_DENIED",
    );
    expect(getSharedExpenseErrorCode(firebaseError("unavailable"))).toBe(
      "NETWORK",
    );
    expect(getSharedExpenseErrorCode(firebaseError("network-request-failed")))
      .toBe("NETWORK");
  });

  it("detects permission failures from the message", () => {
    expect(getSharedExpenseErrorCode(new Error("permission_denied"))).toBe(
      "PERMISSION_DENIED",
    );
    expect(getSharedExpenseErrorCode(new Error("PERMISSION-DENIED"))).toBe(
      "PERMISSION_DENIED",
    );
  });

  it("falls back for unknown failures", () => {
    expect(getSharedExpenseErrorCode(new Error("boom"))).toBe("LOAD_FAILED");
    expect(getSharedExpenseErrorCode("boom", "SAVE_FAILED")).toBe("SAVE_FAILED");
    expect(getSharedExpenseErrorCode(null, "DELETE_FAILED")).toBe(
      "DELETE_FAILED",
    );
  });

  it("keeps a custom fallback for signed-out users", () => {
    expect(getSharedExpenseErrorCode(undefined, "SIGN_IN_REQUIRED")).toBe(
      "SIGN_IN_REQUIRED",
    );
  });
});
