import {
  toGroupExpenseFieldErrors,
  type GroupExpenseFieldErrors,
  type GroupExpenseValidationIssue,
} from "../schemas/group-expense.schema";

export class GroupExpenseValidationError extends Error {
  readonly issues: GroupExpenseValidationIssue[];
  readonly fieldErrors: GroupExpenseFieldErrors;

  constructor(issues: GroupExpenseValidationIssue[]) {
    super(issues[0]?.code ?? "VALIDATION");
    this.name = "GroupExpenseValidationError";
    this.issues = issues;
    this.fieldErrors = toGroupExpenseFieldErrors(issues);
  }
}

/** Stable domain codes; the UI translates them and never sees a sentence. */
export type GroupExpenseOperationCode =
  | "SIGN_IN_REQUIRED"
  | "EXPENSE_NOT_FOUND"
  | "GROUP_NOT_FOUND"
  | "NOT_GROUP_MEMBER"
  | "PAYER_NOT_MEMBER"
  | "NOT_EXPENSE_EDITOR"
  | "GROUP_CHANGED"
  | "ALREADY_DELETED"
  | "EXPENSE_HAS_FORMER_MEMBERS";

export type GroupExpenseErrorCode =
  | GroupExpenseOperationCode
  | "VALIDATION"
  | "PERMISSION_DENIED"
  | "NETWORK"
  | "LOAD_FAILED"
  | "SAVE_FAILED"
  | "DELETE_FAILED";

export class GroupExpenseOperationError extends Error {
  readonly code: GroupExpenseOperationCode;

  constructor(code: GroupExpenseOperationCode) {
    super(code);
    this.name = "GroupExpenseOperationError";
    this.code = code;
  }
}

function readErrorCode(error: Error): string | null {
  const code = (error as { code?: unknown }).code;
  return typeof code === "string" ? code : null;
}

/**
 * Maps group-expense failures to stable codes, mirroring
 * `getSharedExpenseErrorCode` and `getGroupErrorCode`. Services and
 * repositories never return copy.
 */
export function getGroupExpenseErrorCode(
  error: unknown,
  fallback: GroupExpenseErrorCode = "LOAD_FAILED",
): GroupExpenseErrorCode {
  if (error instanceof GroupExpenseValidationError) return "VALIDATION";
  if (error instanceof GroupExpenseOperationError) return error.code;

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
