import { describe, expect, it } from "@jest/globals";

import { createAuthUser } from "./auth-user.fixture";
import { getAuthRedirect } from "../auth-redirect";

describe("getAuthRedirect", () => {
  it("sends anonymous users away from private and verification routes", () => {
    expect(getAuthRedirect({ user: null, segment: "(tabs)" })).toBe("/login");
    expect(getAuthRedirect({ user: null, segment: "categories" })).toBe(
      "/login",
    );
    expect(getAuthRedirect({ user: null, segment: "transfers" })).toBe(
      "/login",
    );
    expect(getAuthRedirect({ user: null, segment: "verify-email" })).toBe(
      "/login",
    );
    expect(getAuthRedirect({ user: null, segment: "login" })).toBeNull();
  });

  it("blocks unverified email/password users from private routes", () => {
    const user = createAuthUser();

    expect(getAuthRedirect({ user, segment: "(tabs)" })).toBe(
      "/verify-email",
    );
    expect(getAuthRedirect({ user, segment: "categories" })).toBe(
      "/verify-email",
    );
    expect(getAuthRedirect({ user, segment: "transfers" })).toBe(
      "/verify-email",
    );
    expect(getAuthRedirect({ user, segment: "login" })).toBe("/verify-email");
    expect(getAuthRedirect({ user, segment: "verify-email" })).toBeNull();
  });

  it("lets verified users into private routes", () => {
    const user = createAuthUser({ emailVerified: true });

    expect(getAuthRedirect({ user, segment: "(tabs)" })).toBeNull();
    expect(getAuthRedirect({ user, segment: "categories" })).toBeNull();
    expect(getAuthRedirect({ user, segment: "transfers" })).toBeNull();
    expect(getAuthRedirect({ user, segment: "login" })).toBe("/(tabs)");
    expect(getAuthRedirect({ user, segment: "verify-email" })).toBe("/(tabs)");
  });

  it("lets Google users through without verification", () => {
    const user = createAuthUser({
      providerIds: ["google.com"],
      emailVerified: false,
    });

    expect(getAuthRedirect({ user, segment: "(tabs)" })).toBeNull();
    expect(getAuthRedirect({ user, segment: "login" })).toBe("/(tabs)");
  });
});
