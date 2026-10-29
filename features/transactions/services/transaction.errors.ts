import {
  toTransactionFieldErrors,
  TransactionValidationErrors,
  TransactionValidationIssue,
} from "../schemas/transaction.schema";

export class TransactionValidationError extends Error {
  readonly issues: TransactionValidationIssue[];
  readonly fieldErrors: TransactionValidationErrors;

  constructor(issues: TransactionValidationIssue[]) {
    super(issues[0]?.message ?? "Los datos del movimiento no son válidos.");
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
  | "CURRENCY_MISMATCH";

const OPERATION_MESSAGES: Record<TransactionOperationCode, string> = {
  TRANSACTION_NOT_FOUND: "El movimiento ya no existe.",
  TRANSACTION_INVALID: "El movimiento no contiene datos válidos.",
  WALLET_NOT_FOUND: "La cartera asociada al movimiento ya no existe.",
  WALLET_NOT_OWNED: "No tienes permisos sobre esta cartera.",
  CURRENCY_MISMATCH:
    "La moneda del movimiento debe coincidir con la de la cartera.",
};

export class TransactionOperationError extends Error {
  readonly code: TransactionOperationCode;

  constructor(code: TransactionOperationCode) {
    super(OPERATION_MESSAGES[code]);
    this.name = "TransactionOperationError";
    this.code = code;
  }
}

function getErrorCode(error: Error): string | null {
  const code = (error as { code?: unknown }).code;
  return typeof code === "string" ? code : null;
}

/**
 * Translates infrastructure errors into user-friendly messages without
 * exposing stack traces or provider details.
 */
export function getTransactionErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (error instanceof TransactionValidationError) {
    return error.message;
  }

  if (error instanceof TransactionOperationError) {
    return error.message;
  }

  if (error instanceof Error) {
    const code = getErrorCode(error);

    if (code === "permission-denied") {
      return "No tienes permisos para realizar esta operación.";
    }

    if (code === "unavailable" || code === "network-request-failed") {
      return "No hay conexión. Comprueba tu red e inténtalo de nuevo.";
    }

    const normalizedMessage = error.message.toLowerCase();
    if (
      normalizedMessage.includes("permission-denied") ||
      normalizedMessage.includes("permission_denied")
    ) {
      return "No tienes permisos para realizar esta operación.";
    }
  }

  return fallback;
}
