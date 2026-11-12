import { describe, expect, it } from "@jest/globals";

import {
  CategoryOperationCode,
  CategoryOperationError,
  CategoryValidationError,
  getCategoryErrorCode,
} from "../category.errors";

const codes: CategoryOperationCode[] = [
  "CATEGORY_NOT_FOUND",
  "CATEGORY_IN_USE",
  "CATEGORY_TYPE_LOCKED",
];

describe("category errors", () => {
  it("exposes every operation code", () => {
    for (const code of codes) {
      const error = new CategoryOperationError(code);

      expect(error.name).toBe("CategoryOperationError");
      expect(error.code).toBe(code);
      expect(error.message).toBe(code);
    }
  });

  it("maps validation issues to their first code and field errors", () => {
    const error = new CategoryValidationError([
      { field: "name", code: "NAME_REQUIRED" },
      { field: "name", code: "NAME_TOO_LONG" },
    ]);

    expect(error.name).toBe("CategoryValidationError");
    expect(error.message).toBe("NAME_REQUIRED");
    expect(error.fieldErrors).toEqual({ name: "NAME_REQUIRED" });
  });

  it("has a fallback code and maps infrastructure failures", () => {
    expect(new CategoryValidationError([]).message).toBe("VALIDATION");
    expect(
      getCategoryErrorCode(
        new CategoryOperationError("CATEGORY_IN_USE"),
        "OPERATION_FAILED",
      ),
    ).toBe("CATEGORY_IN_USE");
    expect(
      getCategoryErrorCode(
        Object.assign(new Error("denied"), { code: "permission-denied" }),
        "OPERATION_FAILED",
      ),
    ).toBe("PERMISSION_DENIED");
    expect(
      getCategoryErrorCode(
        Object.assign(new Error("offline"), { code: "unavailable" }),
        "OPERATION_FAILED",
      ),
    ).toBe("NETWORK");
    expect(
      getCategoryErrorCode(
        Object.assign(new Error("offline"), { code: "network-request-failed" }),
        "OPERATION_FAILED",
      ),
    ).toBe("NETWORK");
    expect(
      getCategoryErrorCode(new Error("permission_denied"), "OPERATION_FAILED"),
    ).toBe("PERMISSION_DENIED");
    expect(getCategoryErrorCode("boom", "OPERATION_FAILED")).toBe(
      "OPERATION_FAILED",
    );
  });
});
