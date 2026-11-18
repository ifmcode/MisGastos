import {
  toSettlementFieldErrors,
  type SettlementFieldErrors,
  type SettlementValidationIssue,
} from "../schemas/settlement.schema";

export class SettlementValidationError extends Error {
  readonly issues: SettlementValidationIssue[];
  readonly fieldErrors: SettlementFieldErrors;

  constructor(issues: SettlementValidationIssue[]) {
    super(issues[0]?.code ?? "VALIDATION");
    this.name = "SettlementValidationError";
    this.issues = issues;
    this.fieldErrors = toSettlementFieldErrors(issues);
  }
}

export type SettlementOperationCode =
  | "SIGN_IN_REQUIRED"
  | "FRIEND_NOT_FOUND"
  | "SETTLEMENT_NOT_FOUND"
  | "NOT_PARTICIPANT"
  | "NO_DEBT"
  | "AMOUNT_EXCEEDS_DEBT"
  | "CURRENCY_MISMATCH"
  | "WALLET_NOT_FOUND"
  | "WALLET_NOT_OWNED"
  | "WALLET_ARCHIVED"
  | "SETTLEMENT_HAS_RECEIVER_MOVEMENT"
  | "AMOUNT_LOCKED"
  | "ALREADY_DELETED"
  | "CATEGORY_REQUIRED";

export type SettlementErrorCode =
  | SettlementOperationCode
  | "VALIDATION"
  | "PERMISSION_DENIED"
  | "NETWORK"
  | "LOAD_FAILED"
  | "SAVE_FAILED"
  | "DELETE_FAILED";

export class SettlementOperationError extends Error {
  readonly code: SettlementOperationCode;

  constructor(code: SettlementOperationCode) {
    super(code);
    this.name = "SettlementOperationError";
    this.code = code;
  }
}

function readErrorCode(error: Error): string | null {
  const code = (error as { code?: unknown }).code;
  return typeof code === "string" ? code : null;
}

/**
 * Maps settlement failures to stable codes. The UI translates them; services
 * and repositories never return user-facing sentences.
 */
export function getSettlementErrorCode(
  error: unknown,
  fallback: SettlementErrorCode = "LOAD_FAILED",
): SettlementErrorCode {
  if (error instanceof SettlementValidationError) return "VALIDATION";
  if (error instanceof SettlementOperationError) return error.code;

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
