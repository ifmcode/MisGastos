export type AuthErrorCode =
  | "invalidEmail"
  | "missingEmail"
  | "userNotFound"
  | "wrongPassword"
  | "emailInUse"
  | "weakPassword"
  | "userDisabled"
  | "tooManyRequests"
  | "network"
  | "requiresRecentLogin"
  | "operationNotAllowed"
  | "operationNotSupported"
  | "playServicesNotAvailable"
  | "missingGoogleIdToken"
  | "googleMissingClientId"
  | "unauthorizedDomain"
  | "configurationNotFound"
  | "popupClosed"
  | "popupBlocked"
  | "accountExistsWithDifferentCredential"
  | "credentialAlreadyInUse"
  | "createFailed"
  | "signInFailed"
  | "googleFailed"
  | "resetFailed"
  | "sendFailed"
  | "checkFailed";

const FIREBASE_CODE_MAP: Record<string, AuthErrorCode> = {
  "auth/invalid-email": "invalidEmail",
  "auth/missing-email": "missingEmail",
  "auth/user-not-found": "userNotFound",
  "auth/wrong-password": "wrongPassword",
  "auth/invalid-credential": "wrongPassword",
  "auth/invalid-login-credentials": "wrongPassword",
  "auth/email-already-in-use": "emailInUse",
  "auth/weak-password": "weakPassword",
  "auth/user-disabled": "userDisabled",
  "auth/too-many-requests": "tooManyRequests",
  "auth/network-request-failed": "network",
  "auth/requires-recent-login": "requiresRecentLogin",
  "auth/operation-not-allowed": "operationNotAllowed",
  "auth/operation-not-supported-in-this-environment": "operationNotSupported",
  "auth/play-services-not-available": "playServicesNotAvailable",
  "auth/missing-google-id-token": "missingGoogleIdToken",
  "auth/google-missing-client-id": "googleMissingClientId",
  "auth/unauthorized-domain": "unauthorizedDomain",
  "auth/configuration-not-found": "configurationNotFound",
  "auth/popup-closed-by-user": "popupClosed",
  "auth/cancelled-popup-request": "popupClosed",
  "auth/popup-blocked": "popupBlocked",
  "auth/account-exists-with-different-credential":
    "accountExistsWithDifferentCredential",
  "auth/credential-already-in-use": "credentialAlreadyInUse",
};

function readErrorCode(error: unknown): string | null {
  if (typeof error !== "object" || error === null) {
    return null;
  }

  const code = (error as { code?: unknown }).code;
  return typeof code === "string" ? code : null;
}

/**
 * Maps Firebase Auth failures to stable codes. The UI translates them; no
 * provider text or Spanish sentence leaves this module.
 */
export function getAuthErrorCode(
  error: unknown,
  fallback: AuthErrorCode,
): AuthErrorCode {
  const code = readErrorCode(error);
  return code ? (FIREBASE_CODE_MAP[code] ?? fallback) : fallback;
}
