import { describe, expect, it } from "@jest/globals";

import {
  getWalletErrorCode,
  WalletValidationError,
} from "../wallet.errors";

function errorWithCode(code: string): Error {
  return Object.assign(new Error("provider detail"), { code });
}

describe("getWalletErrorCode", () => {
  it("returns VALIDATION for validation errors", () => {
    const error = new WalletValidationError([
      { field: "name", code: "NAME_REQUIRED" },
    ]);

    expect(getWalletErrorCode(error, "LOAD_FAILED")).toBe("VALIDATION");
  });

  it("maps permission errors", () => {
    expect(
      getWalletErrorCode(errorWithCode("permission-denied"), "LOAD_FAILED"),
    ).toBe("PERMISSION_DENIED");
    expect(
      getWalletErrorCode(new Error("7 PERMISSION_DENIED"), "LOAD_FAILED"),
    ).toBe("PERMISSION_DENIED");
  });

  it("maps connection errors", () => {
    expect(
      getWalletErrorCode(errorWithCode("unavailable"), "LOAD_FAILED"),
    ).toBe("NETWORK");
    expect(
      getWalletErrorCode(
        errorWithCode("network-request-failed"),
        "LOAD_FAILED",
      ),
    ).toBe("NETWORK");
  });

  it("falls back for unknown errors", () => {
    expect(getWalletErrorCode(new Error("unknown"), "LOAD_FAILED")).toBe(
      "LOAD_FAILED",
    );
    expect(getWalletErrorCode("not an error", "USAGE_FAILED")).toBe(
      "USAGE_FAILED",
    );
    expect(getWalletErrorCode(null, "CREATE_FAILED")).toBe("CREATE_FAILED");
  });
});
