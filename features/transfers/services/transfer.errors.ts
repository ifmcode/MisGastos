import {
  toTransferFieldErrors,
  TransferValidationErrors,
  TransferValidationIssue,
} from "../schemas/transfer.schema";

export class TransferValidationError extends Error {
  readonly issues: TransferValidationIssue[];
  readonly fieldErrors: TransferValidationErrors;

  constructor(issues: TransferValidationIssue[]) {
    super(issues[0]?.message ?? "Los datos de la transferencia no son válidos.");
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

const OPERATION_MESSAGES: Record<TransferOperationCode, string> = {
  TRANSFER_INVALID: "La transferencia no contiene datos válidos.",
  TRANSFER_NOT_FOUND: "La transferencia ya no existe.",
  SAME_WALLET:
    "La cartera de origen y destino deben ser distintas.",
  FROM_WALLET_NOT_FOUND: "La cartera de origen ya no existe.",
  TO_WALLET_NOT_FOUND: "La cartera de destino ya no existe.",
  WALLET_NOT_OWNED: "No tienes permisos sobre una de las carteras.",
  CURRENCY_MISMATCH:
    "Solo puedes transferir entre carteras con la misma moneda.",
  INSUFFICIENT_FUNDS:
    "La cartera de origen no tiene saldo suficiente para esta transferencia.",
};

export class TransferOperationError extends Error {
  readonly code: TransferOperationCode;

  constructor(code: TransferOperationCode) {
    super(OPERATION_MESSAGES[code]);
    this.name = "TransferOperationError";
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
export function getTransferErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (error instanceof TransferValidationError) {
    return error.message;
  }

  if (error instanceof TransferOperationError) {
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
