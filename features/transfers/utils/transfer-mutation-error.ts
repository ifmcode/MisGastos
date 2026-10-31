import { TransferValidationErrors } from "../schemas/transfer.schema";
import {
  getTransferErrorMessage,
  TransferOperationError,
  TransferValidationError,
} from "../services/transfer.errors";

export interface TransferMutationErrorState {
  message: string | null;
  fieldErrors: TransferValidationErrors;
}

/** Maps a failed mutation into the message and field errors shown by the form. */
export function toTransferMutationError(
  failure: unknown,
): TransferMutationErrorState {
  if (failure instanceof TransferValidationError) {
    return { message: failure.message, fieldErrors: failure.fieldErrors };
  }

  if (failure instanceof TransferOperationError) {
    return { message: failure.message, fieldErrors: {} };
  }

  return {
    message: getTransferErrorMessage(
      failure,
      "No se pudo crear la transferencia. Inténtalo de nuevo.",
    ),
    fieldErrors: {},
  };
}
