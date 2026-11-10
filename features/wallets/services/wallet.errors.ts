import {
  toWalletFieldErrors,
  WalletValidationErrors,
  WalletValidationIssue,
} from "../schemas/wallet.schema";

export class WalletValidationError extends Error {
  readonly issues: WalletValidationIssue[];
  readonly fieldErrors: WalletValidationErrors;

  constructor(issues: WalletValidationIssue[]) {
    super(issues[0]?.message ?? "Los datos de la cartera no son válidos.");
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

const OPERATION_MESSAGES: Record<WalletOperationCode, string> = {
  WALLET_NOT_FOUND: "La cartera ya no existe.",
  CURRENCY_LOCKED:
    "No puedes cambiar la moneda de una cartera que ya tiene movimientos.",
  INITIAL_BALANCE_LOCKED:
    "Solo puedes editar el saldo inicial de una cartera sin movimientos.",
  TARGET_WALLET_REQUIRED: "Selecciona la cartera que recibirá los movimientos.",
  TARGET_WALLET_NOT_FOUND: "La cartera de destino ya no existe.",
  TARGET_WALLET_SAME: "La cartera de destino debe ser distinta de la eliminada.",
  TARGET_WALLET_ARCHIVED: "No puedes mover movimientos a una cartera archivada.",
  TARGET_WALLET_CURRENCY_MISMATCH:
    "La cartera de destino debe tener la misma moneda.",
  TARGET_WALLET_INSUFFICIENT_BALANCE:
    "La cartera de destino no tiene saldo suficiente para asumir las transferencias.",
  TOO_MANY_MOVEMENTS:
    "Esta cartera tiene demasiados movimientos para eliminarla de una vez.",
};

export class WalletOperationError extends Error {
  readonly code: WalletOperationCode;

  constructor(code: WalletOperationCode) {
    super(OPERATION_MESSAGES[code]);
    this.name = "WalletOperationError";
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
export function getWalletErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (error instanceof WalletValidationError) {
    return error.message;
  }

  if (error instanceof WalletOperationError) {
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
