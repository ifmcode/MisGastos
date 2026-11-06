import { beforeEach, describe, expect, it } from "@jest/globals";

import {
  consumePendingVerificationEmail,
  markPendingVerificationEmail,
  resetPendingVerificationEmail,
} from "../verification-email-store";

beforeEach(resetPendingVerificationEmail);

describe("verification email store", () => {
  it("consumes the pending email only for the registered account", () => {
    markPendingVerificationEmail("user-1");

    expect(consumePendingVerificationEmail("user-2")).toBe(false);
    expect(consumePendingVerificationEmail("user-1")).toBe(true);
    expect(consumePendingVerificationEmail("user-1")).toBe(false);
  });

  it("does nothing when no account is pending", () => {
    expect(consumePendingVerificationEmail("user-1")).toBe(false);
  });
});
