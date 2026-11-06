import { describe, expect, it } from "@jest/globals";

import { createAuthUser } from "./auth-user.fixture";
import {
  GOOGLE_PROVIDER_ID,
  PASSWORD_PROVIDER_ID,
  isEmailPasswordAccount,
  isGoogleAccount,
  needsEmailVerification,
} from "../email-verification";

describe("email verification policy", () => {
  it("requires verification for an unverified email/password account", () => {
    expect(needsEmailVerification(createAuthUser())).toBe(true);
  });

  it("does not require verification once the address is verified", () => {
    expect(
      needsEmailVerification(createAuthUser({ emailVerified: true })),
    ).toBe(false);
  });

  it("never asks a Google account to verify again", () => {
    const googleUser = createAuthUser({
      providerIds: [GOOGLE_PROVIDER_ID],
      emailVerified: false,
    });

    expect(isGoogleAccount(googleUser)).toBe(true);
    expect(needsEmailVerification(googleUser)).toBe(false);
  });

  it("skips accounts that also link Google", () => {
    const linkedUser = createAuthUser({
      providerIds: [PASSWORD_PROVIDER_ID, GOOGLE_PROVIDER_ID],
      emailVerified: false,
    });

    expect(isEmailPasswordAccount(linkedUser)).toBe(false);
    expect(needsEmailVerification(linkedUser)).toBe(false);
  });

  it("does not block when the provider is unknown", () => {
    expect(
      needsEmailVerification(createAuthUser({ providerIds: [] })),
    ).toBe(false);
    expect(needsEmailVerification(null)).toBe(false);
  });
});
