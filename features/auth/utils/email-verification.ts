import type { AuthUser } from "../types/auth.types";

export const PASSWORD_PROVIDER_ID = "password";
export const GOOGLE_PROVIDER_ID = "google.com";

type ProviderUser = Pick<AuthUser, "providerIds">;

export function isGoogleAccount(user: ProviderUser | null): boolean {
  return user?.providerIds.includes(GOOGLE_PROVIDER_ID) ?? false;
}

export function isEmailPasswordAccount(user: ProviderUser | null): boolean {
  return (
    user?.providerIds.includes(PASSWORD_PROVIDER_ID) === true &&
    !isGoogleAccount(user)
  );
}

/**
 * Only email/password accounts without a confirmed address need verification.
 * Google accounts and accounts with an unknown provider are never blocked.
 */
export function needsEmailVerification(
  user: Pick<AuthUser, "emailVerified" | "providerIds"> | null,
): boolean {
  return (
    isEmailPasswordAccount(user) &&
    user !== null &&
    user.emailVerified === false
  );
}
