import { describe, expect, it } from "@jest/globals";

import {
  getGroupErrorCode,
  GroupOperationError,
  GroupValidationError,
} from "../group.errors";

describe("getGroupErrorCode", () => {
  it("returns the validation and operation codes", () => {
    expect(getGroupErrorCode(new GroupValidationError([]))).toBe("VALIDATION");
    expect(getGroupErrorCode(new GroupOperationError("GROUP_FULL"))).toBe(
      "GROUP_FULL",
    );
  });

  it("maps Firestore transport failures to stable codes", () => {
    const permission = Object.assign(new Error("denied"), {
      code: "permission-denied",
    });
    const offline = Object.assign(new Error("offline"), {
      code: "unavailable",
    });

    expect(getGroupErrorCode(permission)).toBe("PERMISSION_DENIED");
    expect(getGroupErrorCode(offline)).toBe("NETWORK");
    expect(
      getGroupErrorCode(new Error("permission-denied")),
    ).toBe("PERMISSION_DENIED");
  });

  it("keeps the fallback for anything else", () => {
    expect(getGroupErrorCode(new Error("boom"))).toBe("LOAD_FAILED");
    expect(getGroupErrorCode("boom", "SAVE_FAILED")).toBe("SAVE_FAILED");
  });
});
