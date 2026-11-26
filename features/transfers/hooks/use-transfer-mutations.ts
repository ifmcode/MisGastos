import { Dispatch, SetStateAction, useCallback, useState } from "react";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";
import { useSingleFlightMutation } from "@/shared/hooks/use-single-flight-mutation";

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
  const { tr } = useScopedTranslation("transfers");
  const transferService = useTransferService();

  const [createError, setCreateError] = useState<string | null>(null);
  const [createFieldErrors, setCreateFieldErrors] =
    useState<TransferValidationErrors>({});

  const clearCreateState = useCallback(() => {
    setCreateError(null);
    setCreateFieldErrors({});
  }, []);

  const fail = useCallback(
    (failure: unknown): false => {
      const state = toTransferMutationError(failure);
      setCreateError(state.code ? tr(`errors.${state.code}`) : null);
      setCreateFieldErrors(state.fieldErrors);
      return false;
    },
    [tr],
  );

  const unauthenticated = useCallback(
    (key: string) => setCreateError(tr(key)),
    [tr],
  );

  const { mutating, run } = useSingleFlightMutation({
    ownerId,
    clear: clearCreateState,
    fail,
    unauthenticated,
  });

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
      }, "errors.SIGN_IN_CREATE"),
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
      }, "errors.SIGN_IN_EDIT"),
    [run, transferService, setTransfers],
  );

  const deleteTransfer = useCallback(
    (transferId: string) =>
      run(async (currentOwnerId) => {
        await transferService.deleteTransfer(currentOwnerId, transferId);
        setTransfers((current) =>
          current.filter((transfer) => transfer.id !== transferId),
        );
      }, "errors.SIGN_IN_DELETE"),
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
