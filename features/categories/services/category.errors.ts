import {
  toCategoryFieldErrors,
  CategoryValidationErrors,
  CategoryValidationIssue,
} from "../schemas/category.schema";

export class CategoryValidationError extends Error {
  readonly issues: CategoryValidationIssue[];
  readonly fieldErrors: CategoryValidationErrors;

  constructor(issues: CategoryValidationIssue[]) {
    super(issues[0]?.code ?? "VALIDATION");
    this.name = "CategoryValidationError";
    this.issues = issues;
    this.fieldErrors = toCategoryFieldErrors(issues);
  }
}

export type CategoryOperationCode =
  | "CATEGORY_NOT_FOUND"
  | "CATEGORY_IN_USE"
  | "CATEGORY_TYPE_LOCKED";

export type CategoryErrorCode =
  | CategoryOperationCode
  | "VALIDATION"
  | "PERMISSION_DENIED"
  | "NETWORK"
  | "LOAD_FAILED"
  | "CREATE_FAILED"
  | "UPDATE_FAILED"
  | "DELETE_FAILED"
  | "REORDER_FAILED"
  | "OPERATION_FAILED"
  | "SIGN_IN_CREATE"
  | "SIGN_IN_EDIT"
  | "SIGN_IN_DELETE"
  | "SIGN_IN_REORDER";

export class CategoryOperationError extends Error {
  readonly code: CategoryOperationCode;

  constructor(code: CategoryOperationCode) {
    super(code);
    this.name = "CategoryOperationError";
    this.code = code;
  }
}

function readErrorCode(error: Error): string | null {
  const code = (error as { code?: unknown }).code;
  return typeof code === "string" ? code : null;
}

/**
 * Maps category failures to stable codes. The UI translates them; services and
 * repositories never return user-facing sentences.
 */
export function getCategoryErrorCode(
  error: unknown,
  fallback: CategoryErrorCode = "OPERATION_FAILED",
): CategoryErrorCode {
  if (error instanceof CategoryValidationError) return "VALIDATION";
  if (error instanceof CategoryOperationError) return error.code;

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
