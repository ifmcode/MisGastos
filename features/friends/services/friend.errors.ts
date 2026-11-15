import {
  toFriendFieldErrors,
  FriendValidationErrors,
  FriendValidationIssue,
} from "../schemas/friend.schema";

export class FriendValidationError extends Error {
  readonly issues: FriendValidationIssue[];
  readonly fieldErrors: FriendValidationErrors;

  constructor(issues: FriendValidationIssue[]) {
    super(issues[0]?.code ?? "VALIDATION");
    this.name = "FriendValidationError";
    this.issues = issues;
    this.fieldErrors = toFriendFieldErrors(issues);
  }
}

export type FriendOperationCode =
  | "USER_NOT_FOUND"
  | "SELF_REQUEST"
  | "ALREADY_FRIENDS"
  | "DUPLICATE_REQUEST"
  | "INCOMING_REQUEST_EXISTS"
  | "REQUEST_NOT_FOUND"
  | "REQUEST_NOT_PENDING"
  | "NOT_REQUEST_RECIPIENT"
  | "NOT_REQUEST_SENDER"
  | "FRIEND_NOT_FOUND";

export type FriendErrorCode =
  | FriendOperationCode
  | "VALIDATION"
  | "PERMISSION_DENIED"
  | "NETWORK"
  | "LOAD_FAILED"
  | "SEARCH_FAILED"
  | "SEND_FAILED"
  | "RESPOND_FAILED"
  | "REMOVE_FAILED"
  | "PROFILE_FAILED"
  | "SIGN_IN_SEARCH"
  | "SIGN_IN_SEND"
  | "SIGN_IN_RESPOND"
  | "SIGN_IN_REMOVE"
  | "SIGN_IN_PROFILE";

export class FriendOperationError extends Error {
  readonly code: FriendOperationCode;

  constructor(code: FriendOperationCode) {
    super(code);
    this.name = "FriendOperationError";
    this.code = code;
  }
}

function readErrorCode(error: Error): string | null {
  const code = (error as { code?: unknown }).code;
  return typeof code === "string" ? code : null;
}

/**
 * Maps friend failures to stable codes. The UI translates them; services and
 * repositories never return user-facing sentences.
 */
export function getFriendErrorCode(
  error: unknown,
  fallback: FriendErrorCode = "LOAD_FAILED",
): FriendErrorCode {
  if (error instanceof FriendValidationError) return "VALIDATION";
  if (error instanceof FriendOperationError) return error.code;

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
