import {
  toSharedExpenseFieldErrors,
  type SharedExpenseFieldErrors,
  type SharedExpenseValidationIssue,
} from "../schemas/shared-expense.schema";

export class SharedExpenseValidationError extends Error {
  readonly issues: SharedExpenseValidationIssue[];
  readonly fieldErrors: SharedExpenseFieldErrors;

  constructor(issues: SharedExpenseValidationIssue[]) {
    super(issues[0]?.code ?? "VALIDATION");
    this.name = "SharedExpenseValidationError";
    this.issues = issues;
    this.fieldErrors = toSharedExpenseFieldErrors(issues);
  }
}

export type SharedExpenseOperationCode =
  | "SIGN_IN_REQUIRED"
  | "EXPENSE_NOT_FOUND"
  | "NOT_PARTICIPANT"
  | "NOT_FRIEND"
  | "ALREADY_DELETED";

export type SharedExpenseErrorCode =
  | SharedExpenseOperationCode
  | "VALIDATION"
  | "PERMISSION_DENIED"
  | "NETWORK"
  | "LOAD_FAILED"
  | "SAVE_FAILED"
  | "DELETE_FAILED"
  | "SIGN_IN_REQUIRED";

export class SharedExpenseOperationError extends Error {
  readonly code: SharedExpenseOperationCode;

  constructor(code: SharedExpenseOperationCode) {
    super(code);
    this.name = "SharedExpenseOperationError";
    this.code = code;
  }
}

function readErrorCode(error: Error): string | null {
  const code = (error as { code?: unknown }).code;
  return typeof code === "string" ? code : null;
}

/**
 * Maps shared-expense failures to stable codes. The UI translates them; services
 * and repositories never return user-facing sentences.
 */
export function getSharedExpenseErrorCode(
  error: unknown,
  fallback: SharedExpenseErrorCode = "LOAD_FAILED",
): SharedExpenseErrorCode {
  if (error instanceof SharedExpenseValidationError) return "VALIDATION";
  if (error instanceof SharedExpenseOperationError) return error.code;

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
