import { describe, expect, it } from "@jest/globals";

import {
  TransactionOperationError,
  TransactionValidationError,
} from "../../services/transaction.errors";
import { toTransactionMutationError } from "../transaction-mutation-error";

describe("toTransactionMutationError", () => {
  it("keeps the field errors of a validation failure", () => {
    const failure = new TransactionValidationError([
      { field: "amount", code: "INVALID_AMOUNT" },
    ]);

    expect(toTransactionMutationError(failure)).toEqual({
      code: "VALIDATION",
      fieldErrors: { amount: "INVALID_AMOUNT" },
    });
  });

  it("returns the operation code without field errors", () => {
    const failure = new TransactionOperationError("WALLET_NOT_FOUND");

    expect(toTransactionMutationError(failure)).toEqual({
      code: "WALLET_NOT_FOUND",
      fieldErrors: {},
    });
  });

  it("maps unknown failures to stable codes", () => {
    expect(toTransactionMutationError(new Error("permission-denied"))).toEqual({
      code: "PERMISSION_DENIED",
      fieldErrors: {},
    });
    expect(toTransactionMutationError("boom")).toEqual({
      code: "SAVE_FAILED",
      fieldErrors: {},
    });
  });
});
