import {
  toGroupFieldErrors,
  type GroupValidationErrors,
  type GroupValidationIssue,
} from "../schemas/group.schema";

export class GroupValidationError extends Error {
  readonly issues: GroupValidationIssue[];
  readonly fieldErrors: GroupValidationErrors;

  constructor(issues: GroupValidationIssue[]) {
    super(issues[0]?.code ?? "VALIDATION");
    this.name = "GroupValidationError";
    this.issues = issues;
    this.fieldErrors = toGroupFieldErrors(issues);
  }
}

/** Stable domain codes; the UI translates them and never sees a sentence. */
export type GroupOperationCode =
  | "SIGN_IN_REQUIRED"
  | "GROUP_NOT_FOUND"
  | "NOT_GROUP_MEMBER"
  | "NOT_GROUP_OWNER"
  | "GROUP_FULL"
  | "INVITATION_NOT_FOUND"
  | "NOT_INVITEE"
  | "INVITATION_NOT_PENDING"
  | "ALREADY_MEMBER"
  | "NOT_FRIEND"
  | "NO_INVITEES"
  | "MEMBER_NOT_FOUND"
  | "CANNOT_REMOVE_OWNER"
  | "DUPLICATE_INVITEE"
  | "INVALID_JOIN_CODE"
  | "JOIN_REQUEST_NOT_FOUND"
  | "JOIN_REQUEST_NOT_PENDING"
  | "JOIN_REQUEST_ALREADY_PENDING"
  | "JOIN_REQUEST_RESOLVED"
  | "JOIN_CODE_NOT_AVAILABLE";

export type GroupErrorCode =
  | GroupOperationCode
  | "VALIDATION"
  | "PERMISSION_DENIED"
  | "NETWORK"
  | "LOAD_FAILED"
  | "SAVE_FAILED"
  | "DELETE_FAILED";

export class GroupOperationError extends Error {
  readonly code: GroupOperationCode;

  constructor(code: GroupOperationCode) {
    super(code);
    this.name = "GroupOperationError";
    this.code = code;
  }
}

function readErrorCode(error: Error): string | null {
  const code = (error as { code?: unknown }).code;
  return typeof code === "string" ? code : null;
}

/**
 * Maps group failures to stable codes, mirroring `getFriendErrorCode` and
 * `getSharedExpenseErrorCode`. Services and repositories never return copy.
 */
export function getGroupErrorCode(
  error: unknown,
  fallback: GroupErrorCode = "LOAD_FAILED",
): GroupErrorCode {
  if (error instanceof GroupValidationError) return "VALIDATION";
  if (error instanceof GroupOperationError) return error.code;

  if (error instanceof Error) {
    const code = readErrorCode(error);

    if (code === "permission-denied") return "PERMISSION_DENIED";
    if (code === "unavailable" || code === "network-request-failed") {
      return "NETWORK";
    }

    const normalizedMessage = error.message.toLowerCase();
    if (
      normalizedMessage.includes("permission-denied") ||
      normalizedMessage.includes("permission_denied")
    ) {
      return "PERMISSION_DENIED";
    }
  }

  return fallback;
}
