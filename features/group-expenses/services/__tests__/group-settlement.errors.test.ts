import { describe, expect, it } from "@jest/globals";

import {
  getGroupSettlementErrorCode,
  GroupSettlementValidationError,
} from "../group-settlement.errors";
import { GroupExpenseOperationError } from "../group-expense.errors";

describe("GroupSettlementValidationError", () => {
  it("exposes the first code, the issues and one error per field", () => {
    const error = new GroupSettlementValidationError([
      { field: "amount", code: "AMOUNT_INVALID" },
      { field: "note", code: "NOTE_TOO_LONG" },
    ]);

    expect(error.name).toBe("GroupSettlementValidationError");
    expect(error.message).toBe("AMOUNT_INVALID");
    expect(error.fieldErrors).toEqual({
      amount: "AMOUNT_INVALID",
      note: "NOTE_TOO_LONG",
    });
  });

  it("falls back to VALIDATION when there is no issue", () => {
    expect(new GroupSettlementValidationError([]).message).toBe("VALIDATION");
  });
});

describe("getGroupSettlementErrorCode", () => {
  it("maps the shared group-expense codes", () => {
    expect(
      getGroupSettlementErrorCode(
        new GroupExpenseOperationError("SETTLEMENT_HAS_RECEIVER_MOVEMENT"),
      ),
    ).toBe("SETTLEMENT_HAS_RECEIVER_MOVEMENT");
    expect(
      getGroupSettlementErrorCode(new GroupSettlementValidationError([])),
    ).toBe("VALIDATION");
  });

  it("maps transport failures and keeps the fallback", () => {
    expect(
      getGroupSettlementErrorCode(
        Object.assign(new Error("denied"), { code: "permission-denied" }),
      ),
    ).toBe("PERMISSION_DENIED");
    expect(getGroupSettlementErrorCode(new Error("boom"), "DELETE_FAILED")).toBe(
      "DELETE_FAILED",
    );
  });
});
