import {
  toCategoryFieldErrors,
  CategoryValidationErrors,
  CategoryValidationIssue,
} from "../schemas/category.schema";

export class CategoryValidationError extends Error {
  readonly issues: CategoryValidationIssue[];
  readonly fieldErrors: CategoryValidationErrors;

  constructor(issues: CategoryValidationIssue[]) {
    super(issues[0]?.message ?? "Los datos de la categoría no son válidos.");
    this.name = "CategoryValidationError";
    this.issues = issues;
    this.fieldErrors = toCategoryFieldErrors(issues);
  }
}

export type CategoryOperationCode =
  | "CATEGORY_NOT_FOUND"
  | "CATEGORY_IN_USE"
  | "CATEGORY_TYPE_LOCKED";

const OPERATION_MESSAGES: Record<CategoryOperationCode, string> = {
  CATEGORY_NOT_FOUND: "La categoría ya no existe.",
  CATEGORY_IN_USE:
    "No puedes eliminar una categoría que ya se usa en movimientos.",
  CATEGORY_TYPE_LOCKED:
    "No puedes cambiar el tipo de una categoría existente.",
};

export class CategoryOperationError extends Error {
  readonly code: CategoryOperationCode;

  constructor(code: CategoryOperationCode) {
    super(OPERATION_MESSAGES[code]);
    this.name = "CategoryOperationError";
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
export function getCategoryErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (
    error instanceof CategoryValidationError ||
    error instanceof CategoryOperationError
  ) {
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
