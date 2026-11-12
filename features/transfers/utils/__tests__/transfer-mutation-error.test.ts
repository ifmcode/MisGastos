import { describe, expect, it } from "@jest/globals";

import {
  TransferOperationError,
  TransferValidationError,
} from "../../services/transfer.errors";
import { toTransferMutationError } from "../transfer-mutation-error";

describe("toTransferMutationError", () => {
  it("keeps the field errors of a validation failure", () => {
    const failure = new TransferValidationError([
      { field: "amount", code: "INVALID_AMOUNT" },
    ]);

    expect(toTransferMutationError(failure)).toEqual({
      code: "VALIDATION",
      fieldErrors: { amount: "INVALID_AMOUNT" },
    });
  });

  it("returns the operation code without field errors", () => {
    const failure = new TransferOperationError("INSUFFICIENT_FUNDS");

    expect(toTransferMutationError(failure)).toEqual({
      code: "INSUFFICIENT_FUNDS",
      fieldErrors: {},
    });
  });

  it("maps unknown failures to stable codes", () => {
    expect(toTransferMutationError(new Error("permission-denied"))).toEqual({
      code: "PERMISSION_DENIED",
      fieldErrors: {},
    });
    expect(toTransferMutationError("boom")).toEqual({
      code: "SAVE_FAILED",
      fieldErrors: {},
    });
  });
});
