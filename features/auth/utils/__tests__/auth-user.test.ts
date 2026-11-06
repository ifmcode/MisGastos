import { describe, expect, it } from "@jest/globals";

import { toAuthUser } from "../auth-user";

describe("toAuthUser", () => {
  it("maps the Firebase fields used by the app", () => {
    const user = toAuthUser({
      uid: "user-1",
      email: "user@example.com",
      displayName: "Test User",
      emailVerified: true,
      providerData: [{ providerId: "password" }],
    });

    expect(user).toEqual({
      uid: "user-1",
      email: "user@example.com",
      displayName: "Test User",
      emailVerified: true,
      providerIds: ["password"],
      authProvider: "password",
    });
  });

  it("maps every linked provider", () => {
    const user = toAuthUser({
      uid: "user-1",
      email: null,
      displayName: null,
      emailVerified: false,
      providerData: [{ providerId: "password" }, { providerId: "google.com" }],
    });

    expect(user?.providerIds).toEqual(["password", "google.com"]);
  });

  it("returns null without a user", () => {
    expect(toAuthUser(null)).toBeNull();
  });
});
