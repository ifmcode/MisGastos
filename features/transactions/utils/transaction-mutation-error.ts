import { TransactionValidationErrors } from "../schemas/transaction.schema";
import {
  getTransactionErrorMessage,
  TransactionOperationError,
  TransactionValidationError,
} from "../services/transaction.errors";

export interface TransactionMutationErrorState {
  message: string | null;
  fieldErrors: TransactionValidationErrors;
}

/** Maps a failed mutation into the message and field errors shown by the form. */
export function toTransactionMutationError(
  failure: unknown,
): TransactionMutationErrorState {
  if (failure instanceof TransactionValidationError) {
    return { message: failure.message, fieldErrors: failure.fieldErrors };
  }

  if (failure instanceof TransactionOperationError) {
    return { message: failure.message, fieldErrors: {} };
  }

  return {
    message: getTransactionErrorMessage(
      failure,
      "No se pudo guardar el movimiento. Inténtalo de nuevo.",
    ),
    fieldErrors: {},
  };
}
