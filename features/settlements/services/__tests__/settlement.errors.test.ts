import { describe, expect, it } from "@jest/globals";

import {
  getSettlementErrorCode,
  SettlementOperationError,
  SettlementValidationError,
} from "../settlement.errors";

describe("getSettlementErrorCode", () => {
  it("returns the domain operation code", () => {
    expect(
      getSettlementErrorCode(new SettlementOperationError("NO_DEBT"), "SAVE_FAILED"),
    ).toBe("NO_DEBT");
  });

  it("maps a validation error to VALIDATION", () => {
    expect(
      getSettlementErrorCode(
        new SettlementValidationError([
          { field: "amount", code: "AMOUNT_REQUIRED" },
        ]),
      ),
    ).toBe("VALIDATION");
  });

  it("maps Firebase errors and message fallbacks", () => {
    expect(
      getSettlementErrorCode(
        Object.assign(new Error("x"), { code: "permission-denied" }),
      ),
    ).toBe("PERMISSION_DENIED");
    expect(
      getSettlementErrorCode(
        Object.assign(new Error("x"), { code: "network-request-failed" }),
      ),
    ).toBe("NETWORK");
    expect(
      getSettlementErrorCode(new Error("PERMISSION_DENIED: denied")),
    ).toBe("PERMISSION_DENIED");
  });

  it("falls back for unknown failures", () => {
    expect(getSettlementErrorCode(new Error("boom"), "DELETE_FAILED")).toBe(
      "DELETE_FAILED",
    );
    expect(getSettlementErrorCode("boom")).toBe("LOAD_FAILED");
  });
});

describe("SettlementValidationError", () => {
  it("exposes the first code and one error per field", () => {
    const error = new SettlementValidationError([
      { field: "amount", code: "AMOUNT_INVALID" },
      { field: "date", code: "DATE_INVALID" },
    ]);

    expect(error.message).toBe("AMOUNT_INVALID");
    expect(error.fieldErrors).toEqual({
      amount: "AMOUNT_INVALID",
      date: "DATE_INVALID",
    });
  });

  it("defaults the message without issues", () => {
    expect(new SettlementValidationError([]).message).toBe("VALIDATION");
  });
});
