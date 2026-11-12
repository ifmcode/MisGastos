import { TransactionValidationErrors } from "../schemas/transaction.schema";
import {
  getTransactionErrorCode,
  TransactionOperationError,
  TransactionValidationError,
} from "../services/transaction.errors";

export interface TransactionMutationErrorState {
  code: string | null;
  fieldErrors: TransactionValidationErrors;
}

/** Maps a failed mutation into a stable code and field errors. */
export function toTransactionMutationError(
  failure: unknown,
): TransactionMutationErrorState {
  if (failure instanceof TransactionValidationError) {
    return { code: "VALIDATION", fieldErrors: failure.fieldErrors };
  }

  if (failure instanceof TransactionOperationError) {
    return { code: failure.code, fieldErrors: {} };
  }

  return {
    code: getTransactionErrorCode(failure, "SAVE_FAILED"),
    fieldErrors: {},
  };
}
