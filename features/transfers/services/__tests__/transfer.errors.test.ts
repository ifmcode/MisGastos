import { describe, expect, it } from "@jest/globals";

import {
  getTransferErrorCode,
  TransferOperationCode,
  TransferOperationError,
  TransferValidationError,
} from "../transfer.errors";

const codes: TransferOperationCode[] = [
  "TRANSFER_INVALID",
  "TRANSFER_NOT_FOUND",
  "SAME_WALLET",
  "FROM_WALLET_NOT_FOUND",
  "TO_WALLET_NOT_FOUND",
  "WALLET_NOT_OWNED",
  "CURRENCY_MISMATCH",
  "INSUFFICIENT_FUNDS",
];

describe("TransferValidationError", () => {
  it("uses the first issue code and maps the field errors", () => {
    const error = new TransferValidationError([
      { field: "amount", code: "INVALID_AMOUNT" },
      { field: "notes", code: "NOTES_TOO_LONG" },
    ]);

    expect(error.name).toBe("TransferValidationError");
    expect(error.message).toBe("INVALID_AMOUNT");
    expect(error.fieldErrors).toEqual({
      amount: "INVALID_AMOUNT",
      notes: "NOTES_TOO_LONG",
    });
  });

  it("has a fallback code for empty issue lists", () => {
    const error = new TransferValidationError([]);

    expect(error.message).toBe("VALIDATION");
    expect(error.fieldErrors).toEqual({});
  });
});

describe("TransferOperationError", () => {
  it("exposes every operation code", () => {
    for (const code of codes) {
      const error = new TransferOperationError(code);

      expect(error.name).toBe("TransferOperationError");
      expect(error.code).toBe(code);
      expect(error.message).toBe(code);
    }
  });
});

describe("getTransferErrorCode", () => {
  it("returns the code of project errors", () => {
    const validation = new TransferValidationError([
      { field: "amount", code: "INVALID_AMOUNT" },
    ]);
    const operation = new TransferOperationError("SAME_WALLET");

    expect(getTransferErrorCode(validation, "SAVE_FAILED")).toBe("VALIDATION");
    expect(getTransferErrorCode(operation, "SAVE_FAILED")).toBe("SAME_WALLET");
  });

  it("maps infrastructure error codes and messages", () => {
    expect(
      getTransferErrorCode(
        Object.assign(new Error("denied"), { code: "permission-denied" }),
        "SAVE_FAILED",
      ),
    ).toBe("PERMISSION_DENIED");
    expect(
      getTransferErrorCode(
        Object.assign(new Error("offline"), { code: "unavailable" }),
        "SAVE_FAILED",
      ),
    ).toBe("NETWORK");
    expect(
      getTransferErrorCode(
        Object.assign(new Error("offline"), {
          code: "network-request-failed",
        }),
        "SAVE_FAILED",
      ),
    ).toBe("NETWORK");
    expect(
      getTransferErrorCode(new Error("permission_denied"), "SAVE_FAILED"),
    ).toBe("PERMISSION_DENIED");
  });

  it("returns the fallback for unknown failures", () => {
    expect(getTransferErrorCode("boom", "SAVE_FAILED")).toBe("SAVE_FAILED");
    expect(getTransferErrorCode(new Error("other"), "LOAD_FAILED")).toBe(
      "LOAD_FAILED",
    );
  });
});
