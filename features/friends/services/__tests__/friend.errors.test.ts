import { describe, expect, it } from "@jest/globals";

import {
  FriendOperationError,
  FriendValidationError,
  getFriendErrorCode,
} from "../friend.errors";

function firebaseError(code: string, message = "boom"): Error {
  const error = new Error(message);
  (error as { code?: string }).code = code;

  return error;
}

describe("getFriendErrorCode", () => {
  it("maps validation errors", () => {
    const error = new FriendValidationError([
      { field: "email", code: "EMAIL_REQUIRED" },
    ]);

    expect(error.message).toBe("EMAIL_REQUIRED");
    expect(getFriendErrorCode(error)).toBe("VALIDATION");
  });

  it("keeps operation codes", () => {
    const error = new FriendOperationError("ALREADY_FRIENDS");

    expect(error.name).toBe("FriendOperationError");
    expect(getFriendErrorCode(error)).toBe("ALREADY_FRIENDS");
    expect(getFriendErrorCode(new FriendOperationError("FRIEND_NOT_FOUND"))).toBe(
      "FRIEND_NOT_FOUND",
    );
  });

  it("maps Firestore codes", () => {
    expect(getFriendErrorCode(firebaseError("permission-denied"))).toBe(
      "PERMISSION_DENIED",
    );
    expect(getFriendErrorCode(firebaseError("unavailable"))).toBe("NETWORK");
    expect(getFriendErrorCode(firebaseError("network-request-failed"))).toBe(
      "NETWORK",
    );
  });

  it("detects permission failures from the message", () => {
    expect(getFriendErrorCode(new Error("permission_denied"))).toBe(
      "PERMISSION_DENIED",
    );
    expect(getFriendErrorCode(new Error("PERMISSION-DENIED"))).toBe(
      "PERMISSION_DENIED",
    );
  });

  it("falls back for unknown failures", () => {
    expect(getFriendErrorCode(new Error("boom"))).toBe("LOAD_FAILED");
    expect(getFriendErrorCode("boom", "SEARCH_FAILED")).toBe("SEARCH_FAILED");
    expect(getFriendErrorCode(null, "SEND_FAILED")).toBe("SEND_FAILED");
  });
});
