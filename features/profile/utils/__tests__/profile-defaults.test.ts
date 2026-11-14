import { describe, expect, it } from "@jest/globals";

import type { AuthUser } from "@/features/auth/types/auth.types";

import { Profile } from "../../types/profile.types";
import {
  buildProfileFormValues,
  createProfileFromAuth,
} from "../profile-defaults";

const authUser: AuthUser = {
  uid: "user-1",
  email: "ada@example.com",
  displayName: "Ada Lovelace",
  emailVerified: true,
  providerIds: ["password"],
};

const profile: Profile = {
  id: "doc-1",
  uid: "user-1",
  email: "ada@example.com",
  displayName: "Ada",
  preferredCurrency: "USD",
};

describe("profile defaults", () => {
  it("creates an editable profile from the auth snapshot", () => {
    expect(createProfileFromAuth(authUser)).toEqual({
      id: "",
      uid: "user-1",
      email: "ada@example.com",
      displayName: "Ada Lovelace",
      preferredCurrency: "EUR",
    });
  });

  it("builds form values and falls back to an empty name", () => {
    expect(buildProfileFormValues(profile)).toEqual({
      displayName: "Ada",
      preferredCurrency: "USD",
    });
    expect(
      buildProfileFormValues({ ...profile, displayName: null }),
    ).toEqual({ displayName: "", preferredCurrency: "USD" });
  });
});
