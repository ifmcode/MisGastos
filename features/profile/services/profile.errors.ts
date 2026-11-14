import {
  toProfileFieldErrors,
  ProfileValidationErrors,
  ProfileValidationIssue,
} from "../schemas/profile.schema";

export class ProfileValidationError extends Error {
  readonly issues: ProfileValidationIssue[];
  readonly fieldErrors: ProfileValidationErrors;

  constructor(issues: ProfileValidationIssue[]) {
    super(issues[0]?.code ?? "VALIDATION");
    this.name = "ProfileValidationError";
    this.issues = issues;
    this.fieldErrors = toProfileFieldErrors(issues);
  }
}

export type ProfileErrorCode =
  | "VALIDATION"
  | "PERMISSION_DENIED"
  | "NETWORK"
  | "LOAD_FAILED"
  | "SAVE_FAILED";

function readErrorCode(error: Error): string | null {
  const code = (error as { code?: unknown }).code;
  return typeof code === "string" ? code : null;
}

/** Maps profile failures to stable codes translated by the UI. */
export function getProfileErrorCode(
  error: unknown,
  fallback: ProfileErrorCode = "LOAD_FAILED",
): ProfileErrorCode {
  if (error instanceof ProfileValidationError) return "VALIDATION";

  if (error instanceof Error) {
    const code = readErrorCode(error);

    if (code === "permission-denied") return "PERMISSION_DENIED";
    if (code === "unavailable" || code === "network-request-failed") {
      return "NETWORK";
    }

    const message = error.message.toLowerCase();
    if (
      message.includes("permission-denied") ||
      message.includes("permission_denied")
    ) {
      return "PERMISSION_DENIED";
    }
  }

  return fallback;
}
