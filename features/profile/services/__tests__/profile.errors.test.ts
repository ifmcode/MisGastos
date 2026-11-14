import { describe, expect, it } from "@jest/globals";

import {
  getProfileErrorCode,
  ProfileValidationError,
} from "../profile.errors";

describe("getProfileErrorCode", () => {
  it("maps validation errors", () => {
    expect(
      getProfileErrorCode(
        new ProfileValidationError([
          { field: "displayName", code: "NAME_REQUIRED" },
        ]),
      ),
    ).toBe("VALIDATION");
  });

  it("maps Firebase permission and network codes", () => {
    expect(
      getProfileErrorCode(
        Object.assign(new Error("denied"), { code: "permission-denied" }),
      ),
    ).toBe("PERMISSION_DENIED");
    expect(
      getProfileErrorCode(
        Object.assign(new Error("offline"), { code: "unavailable" }),
      ),
    ).toBe("NETWORK");
    expect(
      getProfileErrorCode(
        Object.assign(new Error("offline"), {
          code: "network-request-failed",
        }),
      ),
    ).toBe("NETWORK");
  });

  it("detects permission messages and uses the requested fallback", () => {
    expect(getProfileErrorCode(new Error("PERMISSION_DENIED"))).toBe(
      "PERMISSION_DENIED",
    );
    expect(getProfileErrorCode(new Error("boom"), "SAVE_FAILED")).toBe(
      "SAVE_FAILED",
    );
    expect(getProfileErrorCode("unknown")).toBe("LOAD_FAILED");
  });
});
