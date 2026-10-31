import {
  Dispatch,
  SetStateAction,
  useCallback,
  useState,
} from "react";

import {
  TransferInput,
  TransferValidationErrors,
} from "../schemas/transfer.schema";
import { Transfer } from "../types/transfer.types";
import { toTransferMutationError } from "../utils/transfer-mutation-error";
import { sortTransfersByDate } from "../utils/transfer-sort";
import { useTransferService } from "./use-transfer-service";

export interface UseTransferMutationsOptions {
  ownerId: string | undefined;
  setTransfers: Dispatch<SetStateAction<Transfer[]>>;
}

export interface TransferMutations {
  mutating: boolean;
  createError: string | null;
  createFieldErrors: TransferValidationErrors;
  clearCreateState: () => void;
  createTransfer: (input: TransferInput) => Promise<boolean>;
  updateTransfer: (
    transferId: string,
    input: TransferInput,
  ) => Promise<boolean>;
  deleteTransfer: (transferId: string) => Promise<boolean>;
}

/** Owns the create/update/delete flows and their error state. */
export function useTransferMutations({
  ownerId,
  setTransfers,
}: UseTransferMutationsOptions): TransferMutations {
  const transferService = useTransferService();

  const [mutating, setMutating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createFieldErrors, setCreateFieldErrors] =
    useState<TransferValidationErrors>({});

  const clearCreateState = useCallback(() => {
    setCreateError(null);
    setCreateFieldErrors({});
  }, []);

  const fail = useCallback((failure: unknown): false => {
    const state = toTransferMutationError(failure);
    setCreateError(state.message);
    setCreateFieldErrors(state.fieldErrors);
    return false;
  }, []);

  const run = useCallback(
    async (
      operation: (ownerId: string) => Promise<void>,
      unauthenticatedMessage: string,
    ): Promise<boolean> => {
      if (!ownerId) {
        setCreateError(unauthenticatedMessage);
        return false;
      }

      setMutating(true);
      clearCreateState();

      try {
        await operation(ownerId);
        return true;
      } catch (failure: unknown) {
        return fail(failure);
      } finally {
        setMutating(false);
      }
    },
    [ownerId, clearCreateState, fail],
  );

  const createTransfer = useCallback(
    (input: TransferInput) =>
      run(async (currentOwnerId) => {
        const result = await transferService.createTransfer(
          currentOwnerId,
          input,
        );
        setTransfers((current) =>
          sortTransfersByDate([result.transfer, ...current]),
        );
      }, "Debes iniciar sesión para crear una transferencia."),
    [run, transferService, setTransfers],
  );

  const updateTransfer = useCallback(
    (transferId: string, input: TransferInput) =>
      run(async (currentOwnerId) => {
        const result = await transferService.updateTransfer(
          currentOwnerId,
          transferId,
          input,
        );
        setTransfers((current) =>
          sortTransfersByDate(
            current.map((transfer) =>
              transfer.id === transferId ? result.transfer : transfer,
            ),
          ),
        );
      }, "Debes iniciar sesión para editar una transferencia."),
    [run, transferService, setTransfers],
  );

  const deleteTransfer = useCallback(
    (transferId: string) =>
      run(async (currentOwnerId) => {
        await transferService.deleteTransfer(currentOwnerId, transferId);
        setTransfers((current) =>
          current.filter((transfer) => transfer.id !== transferId),
        );
      }, "Debes iniciar sesión para eliminar una transferencia."),
    [run, transferService, setTransfers],
  );

  return {
    mutating,
    createError,
    createFieldErrors,
    clearCreateState,
    createTransfer,
    updateTransfer,
    deleteTransfer,
  };
}
