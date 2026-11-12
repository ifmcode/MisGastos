import { useCallback } from "react";

import { useAuth } from "@/hooks/use-auth";
import { useAsyncCollection } from "@/shared/hooks/use-async-collection";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import {
  TransferInput,
  TransferValidationErrors,
} from "../schemas/transfer.schema";
import { getTransferErrorCode } from "../services/transfer.errors";
import { Transfer } from "../types/transfer.types";
import { sortTransfersByDate } from "../utils/transfer-sort";
import { useTransferMutations } from "./use-transfer-mutations";
import { useTransferService } from "./use-transfer-service";

export interface UseTransfersResult {
  transfers: Transfer[];
  loading: boolean;
  refreshing: boolean;
  mutating: boolean;
  error: string | null;
  createError: string | null;
  createFieldErrors: TransferValidationErrors;
  reload: () => Promise<void>;
  refresh: () => Promise<void>;
  createTransfer: (input: TransferInput) => Promise<boolean>;
  updateTransfer: (
    transferId: string,
    input: TransferInput,
  ) => Promise<boolean>;
  deleteTransfer: (transferId: string) => Promise<boolean>;
  clearCreateState: () => void;
}

/** Loads the owner's transfers and exposes the create/update/delete flows. */
export function useTransfers(): UseTransfersResult {
  const { user } = useAuth();
  const { tr } = useScopedTranslation("transfers");
  const ownerId = user?.uid;
  const transferService = useTransferService();

  const loadTransfers = useCallback(
    async (currentOwnerId: string) =>
      sortTransfersByDate(
        await transferService.getTransfers(currentOwnerId),
      ),
    [transferService],
  );
  const describeLoadError = useCallback(
    (error: unknown) =>
      tr(`errors.${getTransferErrorCode(error, "LOAD_FAILED")}`),
    [tr],
  );

  const {
    items: transfers,
    setItems: setTransfers,
    loading,
    refreshing,
    error,
    reload,
    refresh,
  } = useAsyncCollection<Transfer>({
    ownerId,
    load: loadTransfers,
    describeError: describeLoadError,
  });

  const mutations = useTransferMutations({ ownerId, setTransfers });

  return {
    transfers,
    loading,
    refreshing,
    error,
    reload,
    refresh,
    ...mutations,
  };
}
