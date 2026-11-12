import { TransferValidationErrors } from "../schemas/transfer.schema";
import {
  getTransferErrorCode,
  TransferOperationError,
  TransferValidationError,
} from "../services/transfer.errors";

export interface TransferMutationErrorState {
  code: string | null;
  fieldErrors: TransferValidationErrors;
}

/** Maps a failed mutation into a stable code and field errors. */
export function toTransferMutationError(
  failure: unknown,
): TransferMutationErrorState {
  if (failure instanceof TransferValidationError) {
    return { code: "VALIDATION", fieldErrors: failure.fieldErrors };
  }

  if (failure instanceof TransferOperationError) {
    return { code: failure.code, fieldErrors: {} };
  }

  return {
    code: getTransferErrorCode(failure, "SAVE_FAILED"),
    fieldErrors: {},
  };
}
