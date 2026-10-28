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
