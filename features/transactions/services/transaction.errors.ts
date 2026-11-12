import {
  toTransactionFieldErrors,
  TransactionValidationErrors,
  TransactionValidationIssue,
} from "../schemas/transaction.schema";

export class TransactionValidationError extends Error {
  readonly issues: TransactionValidationIssue[];
  readonly fieldErrors: TransactionValidationErrors;

  constructor(issues: TransactionValidationIssue[]) {
    super(issues[0]?.code ?? "VALIDATION");
    this.name = "TransactionValidationError";
    this.issues = issues;
    this.fieldErrors = toTransactionFieldErrors(issues);
  }
}

export type TransactionOperationCode =
  | "TRANSACTION_NOT_FOUND"
  | "TRANSACTION_INVALID"
  | "WALLET_NOT_FOUND"
  | "WALLET_NOT_OWNED"
  | "CURRENCY_MISMATCH"
  | "CATEGORY_NOT_FOUND"
  | "CATEGORY_TYPE_MISMATCH";

export type TransactionErrorCode =
  | TransactionOperationCode
  | "VALIDATION"
  | "PERMISSION_DENIED"
  | "NETWORK"
  | "LOAD_FAILED"
  | "SAVE_FAILED"
  | "SIGN_IN_CREATE"
  | "SIGN_IN_EDIT"
  | "SIGN_IN_DELETE";

export class TransactionOperationError extends Error {
  readonly code: TransactionOperationCode;

  constructor(code: TransactionOperationCode) {
    super(code);
    this.name = "TransactionOperationError";
    this.code = code;
  }
}

function readErrorCode(error: Error): string | null {
  const code = (error as { code?: unknown }).code;
  return typeof code === "string" ? code : null;
}

/**
 * Maps transaction failures to stable codes. The UI translates them; services
 * and repositories never return user-facing sentences.
 */
export function getTransactionErrorCode(
  error: unknown,
  fallback: TransactionErrorCode = "SAVE_FAILED",
): TransactionErrorCode {
  if (error instanceof TransactionValidationError) return "VALIDATION";
  if (error instanceof TransactionOperationError) return error.code;

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
