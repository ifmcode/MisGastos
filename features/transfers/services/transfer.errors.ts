import {
  toTransferFieldErrors,
  TransferValidationErrors,
  TransferValidationIssue,
} from "../schemas/transfer.schema";

export class TransferValidationError extends Error {
  readonly issues: TransferValidationIssue[];
  readonly fieldErrors: TransferValidationErrors;

  constructor(issues: TransferValidationIssue[]) {
    super(issues[0]?.code ?? "VALIDATION");
    this.name = "TransferValidationError";
    this.issues = issues;
    this.fieldErrors = toTransferFieldErrors(issues);
  }
}

export type TransferOperationCode =
  | "TRANSFER_INVALID"
  | "TRANSFER_NOT_FOUND"
  | "SAME_WALLET"
  | "FROM_WALLET_NOT_FOUND"
  | "TO_WALLET_NOT_FOUND"
  | "WALLET_NOT_OWNED"
  | "CURRENCY_MISMATCH"
  | "INSUFFICIENT_FUNDS";

export type TransferErrorCode =
  | TransferOperationCode
  | "VALIDATION"
  | "PERMISSION_DENIED"
  | "NETWORK"
  | "LOAD_FAILED"
  | "SAVE_FAILED"
  | "SIGN_IN_CREATE"
  | "SIGN_IN_EDIT"
  | "SIGN_IN_DELETE";

export class TransferOperationError extends Error {
  readonly code: TransferOperationCode;

  constructor(code: TransferOperationCode) {
    super(code);
    this.name = "TransferOperationError";
    this.code = code;
  }
}

function readErrorCode(error: Error): string | null {
  const code = (error as { code?: unknown }).code;
  return typeof code === "string" ? code : null;
}

/**
 * Maps transfer failures to stable codes. The UI translates them; services and
 * repositories never return user-facing sentences.
 */
export function getTransferErrorCode(
  error: unknown,
  fallback: TransferErrorCode = "SAVE_FAILED",
): TransferErrorCode {
  if (error instanceof TransferValidationError) return "VALIDATION";
  if (error instanceof TransferOperationError) return error.code;

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
