import type { AuthUser } from "../../types/auth.types";

export function createAuthUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    uid: "user-1",
    email: "user@example.com",
    displayName: "Test User",
    emailVerified: false,
    providerIds: ["password"],
    authProvider: "password",
    ...overrides,
  };
}
