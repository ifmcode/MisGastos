import {
  toWalletFieldErrors,
  WalletValidationErrors,
  WalletValidationIssue,
} from "../schemas/wallet.schema";

export class WalletValidationError extends Error {
  readonly issues: WalletValidationIssue[];
  readonly fieldErrors: WalletValidationErrors;

  constructor(issues: WalletValidationIssue[]) {
    super(issues[0]?.code ?? "VALIDATION");
    this.name = "WalletValidationError";
    this.issues = issues;
    this.fieldErrors = toWalletFieldErrors(issues);
  }
}

export type WalletOperationCode =
  | "WALLET_NOT_FOUND"
  | "CURRENCY_LOCKED"
  | "INITIAL_BALANCE_LOCKED"
  | "TARGET_WALLET_REQUIRED"
  | "TARGET_WALLET_NOT_FOUND"
  | "TARGET_WALLET_SAME"
  | "TARGET_WALLET_ARCHIVED"
  | "TARGET_WALLET_CURRENCY_MISMATCH"
  | "TARGET_WALLET_INSUFFICIENT_BALANCE"
  | "TOO_MANY_MOVEMENTS";

export type WalletErrorCode =
  | WalletOperationCode
  | "VALIDATION"
  | "PERMISSION_DENIED"
  | "NETWORK"
  | "CREATE_FAILED"
  | "UPDATE_FAILED"
  | "ARCHIVE_FAILED"
  | "DELETE_FAILED"
  | "LOAD_FAILED"
  | "USAGE_FAILED"
  | "SIGN_IN_CREATE"
  | "SIGN_IN_UPDATE"
  | "SIGN_IN_ARCHIVE"
  | "SIGN_IN_DELETE"
  | "SIGN_IN_USAGE";

export class WalletOperationError extends Error {
  readonly code: WalletOperationCode;

  constructor(code: WalletOperationCode) {
    super(code);
    this.name = "WalletOperationError";
    this.code = code;
  }
}

function readErrorCode(error: Error): string | null {
  const code = (error as { code?: unknown }).code;
  return typeof code === "string" ? code : null;
}

/**
 * Maps wallet failures to stable codes. The UI translates them; services and
 * repositories never return user-facing sentences.
 */
export function getWalletErrorCode(
  error: unknown,
  fallback: WalletErrorCode = "LOAD_FAILED",
): WalletErrorCode {
  if (error instanceof WalletValidationError) return "VALIDATION";
  if (error instanceof WalletOperationError) return error.code;

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
