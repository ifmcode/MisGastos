import { describe, expect, it } from "@jest/globals";

import {
  getTransactionErrorCode,
  TransactionOperationCode,
  TransactionOperationError,
  TransactionValidationError,
} from "../transaction.errors";

const codes: TransactionOperationCode[] = [
  "TRANSACTION_NOT_FOUND",
  "TRANSACTION_INVALID",
  "WALLET_NOT_FOUND",
  "WALLET_NOT_OWNED",
  "CURRENCY_MISMATCH",
  "CATEGORY_NOT_FOUND",
  "CATEGORY_TYPE_MISMATCH",
];

describe("TransactionValidationError", () => {
  it("uses the first issue code and maps the field errors", () => {
    const error = new TransactionValidationError([
      { field: "amount", code: "INVALID_AMOUNT" },
      { field: "concept", code: "CONCEPT_REQUIRED" },
    ]);

    expect(error.name).toBe("TransactionValidationError");
    expect(error.message).toBe("INVALID_AMOUNT");
    expect(error.fieldErrors).toEqual({
      amount: "INVALID_AMOUNT",
      concept: "CONCEPT_REQUIRED",
    });
  });

  it("has a fallback code for empty issue lists", () => {
    const error = new TransactionValidationError([]);

    expect(error.message).toBe("VALIDATION");
    expect(error.fieldErrors).toEqual({});
  });
});

describe("TransactionOperationError", () => {
  it("exposes every operation code", () => {
    for (const code of codes) {
      const error = new TransactionOperationError(code);

      expect(error.name).toBe("TransactionOperationError");
      expect(error.code).toBe(code);
      expect(error.message).toBe(code);
    }
  });
});

describe("getTransactionErrorCode", () => {
  it("returns the code of project errors", () => {
    const validation = new TransactionValidationError([
      { field: "amount", code: "INVALID_AMOUNT" },
    ]);
    const operation = new TransactionOperationError("WALLET_NOT_FOUND");

    expect(getTransactionErrorCode(validation, "SAVE_FAILED")).toBe(
      "VALIDATION",
    );
    expect(getTransactionErrorCode(operation, "SAVE_FAILED")).toBe(
      "WALLET_NOT_FOUND",
    );
  });

  it("maps infrastructure error codes", () => {
    expect(
      getTransactionErrorCode(
        Object.assign(new Error("denied"), { code: "permission-denied" }),
        "SAVE_FAILED",
      ),
    ).toBe("PERMISSION_DENIED");
    expect(
      getTransactionErrorCode(
        Object.assign(new Error("offline"), { code: "unavailable" }),
        "SAVE_FAILED",
      ),
    ).toBe("NETWORK");
    expect(
      getTransactionErrorCode(
        Object.assign(new Error("offline"), { code: "network-request-failed" }),
        "SAVE_FAILED",
      ),
    ).toBe("NETWORK");
  });

  it("maps permission messages written in the error text", () => {
    expect(
      getTransactionErrorCode(new Error("permission-denied"), "SAVE_FAILED"),
    ).toBe("PERMISSION_DENIED");
    expect(
      getTransactionErrorCode(new Error("permission_denied"), "SAVE_FAILED"),
    ).toBe("PERMISSION_DENIED");
  });

  it("returns the fallback for unknown failures", () => {
    expect(getTransactionErrorCode("boom", "SAVE_FAILED")).toBe("SAVE_FAILED");
    expect(
      getTransactionErrorCode(new Error("other"), "LOAD_FAILED"),
    ).toBe("LOAD_FAILED");
  });
});
