import type { AuthUser } from "../types/auth.types";
import { needsEmailVerification } from "./email-verification";

const PRIVATE_SEGMENTS = new Set(["(tabs)", "categories"]);
const VERIFY_SEGMENT = "verify-email";

export type AuthRedirectTarget = "/login" | "/verify-email" | "/(tabs)";

export interface AuthRedirectInput {
  user: AuthUser | null;
  segment: string | undefined;
}

/**
 * Decides where the root navigator should send the user.
 *
 * Policy: unverified email/password accounts cannot enter private routes.
 * They are redirected to /verify-email, where they can resend the email,
 * refresh the status or sign out. Google accounts and accounts with an
 * unknown provider keep their current access.
 */
export function getAuthRedirect({
  user,
  segment,
}: AuthRedirectInput): AuthRedirectTarget | null {
  const inPrivateRoute =
    segment !== undefined && PRIVATE_SEGMENTS.has(segment);
  const inVerifyRoute = segment === VERIFY_SEGMENT;

  if (!user) {
    return inPrivateRoute || inVerifyRoute ? "/login" : null;
  }

  if (needsEmailVerification(user)) {
    return inVerifyRoute ? null : "/verify-email";
  }

  return inPrivateRoute ? null : "/(tabs)";
}
