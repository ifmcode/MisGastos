import { describe, expect, it } from "@jest/globals";

import { getAuthErrorCode } from "../auth.errors";

function errorWithCode(code: string): Error {
  return Object.assign(new Error("provider detail"), { code });
}

describe("getAuthErrorCode", () => {
  it("maps invalid credentials and unknown emails", () => {
    expect(
      getAuthErrorCode(errorWithCode("auth/wrong-password"), "signInFailed"),
    ).toBe("wrongPassword");
    expect(
      getAuthErrorCode(errorWithCode("auth/invalid-credential"), "signInFailed"),
    ).toBe("wrongPassword");
    expect(
      getAuthErrorCode(
        errorWithCode("auth/invalid-login-credentials"),
        "signInFailed",
      ),
    ).toBe("wrongPassword");
  });

  it("maps unknown emails", () => {
    expect(
      getAuthErrorCode(errorWithCode("auth/user-not-found"), "signInFailed"),
    ).toBe("userNotFound");
  });

  it("maps email and password validation errors", () => {
    expect(
      getAuthErrorCode(errorWithCode("auth/invalid-email"), "signInFailed"),
    ).toBe("invalidEmail");
    expect(
      getAuthErrorCode(errorWithCode("auth/email-already-in-use"), "signInFailed"),
    ).toBe("emailInUse");
    expect(
      getAuthErrorCode(errorWithCode("auth/weak-password"), "signInFailed"),
    ).toBe("weakPassword");
  });

  it("maps rate limits and connection failures", () => {
    expect(
      getAuthErrorCode(errorWithCode("auth/too-many-requests"), "signInFailed"),
    ).toBe("tooManyRequests");
    expect(
      getAuthErrorCode(
        errorWithCode("auth/network-request-failed"),
        "signInFailed",
      ),
    ).toBe("network");
  });

  it("maps Google popup failures", () => {
    expect(
      getAuthErrorCode(
        errorWithCode("auth/popup-closed-by-user"),
        "googleFailed",
      ),
    ).toBe("popupClosed");
    expect(
      getAuthErrorCode(errorWithCode("auth/popup-blocked"), "googleFailed"),
    ).toBe("popupBlocked");
  });

  it("returns the fallback code for unknown errors", () => {
    expect(getAuthErrorCode(new Error("raw detail"), "signInFailed")).toBe(
      "signInFailed",
    );
    expect(getAuthErrorCode("not an error", "googleFailed")).toBe(
      "googleFailed",
    );
    expect(getAuthErrorCode(null, "resetFailed")).toBe("resetFailed");
  });
});
