import { describe, expect, it } from "@jest/globals";

import {
  GroupExpenseOperationError,
  GroupExpenseValidationError,
  getGroupExpenseErrorCode,
} from "../group-expense.errors";

function firebaseError(code: string, message = "boom"): Error {
  const error = new Error(message);
  (error as { code?: string }).code = code;

  return error;
}

describe("GroupExpenseValidationError", () => {
  it("keeps the issues and the first code per field", () => {
    const error = new GroupExpenseValidationError([
      { field: "amount", code: "AMOUNT_INVALID" },
      { field: "participants", code: "PARTICIPANTS_REQUIRED" },
    ]);

    expect(error.name).toBe("GroupExpenseValidationError");
    expect(error.message).toBe("AMOUNT_INVALID");
    expect(error.fieldErrors).toEqual({
      amount: "AMOUNT_INVALID",
      participants: "PARTICIPANTS_REQUIRED",
    });
  });

  it("falls back to VALIDATION without issues", () => {
    expect(new GroupExpenseValidationError([]).message).toBe("VALIDATION");
  });
});

describe("getGroupExpenseErrorCode", () => {
  it("maps validation errors", () => {
    const error = new GroupExpenseValidationError([
      { field: "date", code: "DATE_INVALID" },
    ]);

    expect(getGroupExpenseErrorCode(error)).toBe("VALIDATION");
  });

  it("keeps every operation code", () => {
    const codes = [
      "SIGN_IN_REQUIRED",
      "EXPENSE_NOT_FOUND",
      "GROUP_NOT_FOUND",
      "NOT_GROUP_MEMBER",
      "PAYER_NOT_MEMBER",
      "NOT_EXPENSE_EDITOR",
      "GROUP_CHANGED",
      "ALREADY_DELETED",
      "EXPENSE_HAS_FORMER_MEMBERS",
    ] as const;

    for (const code of codes) {
      const error = new GroupExpenseOperationError(code);

      expect(error.name).toBe("GroupExpenseOperationError");
      expect(error.code).toBe(code);
      expect(getGroupExpenseErrorCode(error)).toBe(code);
    }
  });

  it("maps Firestore codes", () => {
    expect(getGroupExpenseErrorCode(firebaseError("permission-denied"))).toBe(
      "PERMISSION_DENIED",
    );
    expect(getGroupExpenseErrorCode(firebaseError("unavailable"))).toBe(
      "NETWORK",
    );
    expect(getGroupExpenseErrorCode(firebaseError("network-request-failed")))
      .toBe("NETWORK");
  });

  it("detects permission failures from the message", () => {
    expect(getGroupExpenseErrorCode(new Error("permission_denied"))).toBe(
      "PERMISSION_DENIED",
    );
    expect(getGroupExpenseErrorCode(new Error("PERMISSION-DENIED"))).toBe(
      "PERMISSION_DENIED",
    );
  });

  it("falls back for unknown failures", () => {
    expect(getGroupExpenseErrorCode(new Error("boom"))).toBe("LOAD_FAILED");
    expect(getGroupExpenseErrorCode("boom", "SAVE_FAILED")).toBe("SAVE_FAILED");
    expect(getGroupExpenseErrorCode(null, "DELETE_FAILED")).toBe(
      "DELETE_FAILED",
    );
  });
});
