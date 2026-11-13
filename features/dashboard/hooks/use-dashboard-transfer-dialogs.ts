import { useCallback } from "react";

import {
  TransferDetailDialog,
  useTransferDetailDialog,
} from "@/features/transfers/hooks/use-transfer-detail-dialog";
import {
  TransferFormDialog,
  useTransferFormDialog,
} from "@/features/transfers/hooks/use-transfer-form-dialog";
import {
  TransferInput,
  TransferValidationErrors,
} from "@/features/transfers/schemas/transfer.schema";
import { Transfer } from "@/features/transfers/types/transfer.types";

import { createDashboardTransferActions } from "../utils/dashboard-transfer-actions";

export interface DashboardTransferMutations {
  mutating: boolean;
  createError: string | null;
  createFieldErrors: TransferValidationErrors;
  /** Required by the shared dialog, which the dashboard only opens in edit mode. */
  createTransfer: (input: TransferInput) => Promise<boolean>;
  updateTransfer: (
    transferId: string,
    input: TransferInput,
  ) => Promise<boolean>;
  deleteTransfer: (transferId: string) => Promise<boolean>;
  clearCreateState: () => void;
}

export interface UseDashboardTransferDialogsOptions {
  transfers: readonly Transfer[];
  mutations: DashboardTransferMutations;
  /** Reloads the dashboard wallets so the balances and totals follow. */
  onWalletsChanged: () => Promise<void> | void;
}

export interface DashboardTransferDialogs {
  detail: TransferDetailDialog;
  form: TransferFormDialog;
  openDetail: (transfer: Transfer) => void;
  editFromDetail: (transfer: Transfer) => void;
  deleteTransfer: (transferId: string) => Promise<boolean>;
}

/**
 * Reuses the transfer detail and form dialogs from the transfers feature, so
 * the dashboard opens the same view as any other entry point. The dashboard
 * only opens the form in edit mode.
 */
export function useDashboardTransferDialogs({
  transfers,
  mutations,
  onWalletsChanged,
}: UseDashboardTransferDialogsOptions): DashboardTransferDialogs {
  // Deleting from the detail changes wallet balances, and the dashboard owns its
  // own `useWallets` instance, so refresh it to keep the totals in sync.
  const deleteTransfer = useCallback(
    async (transferId: string) => {
      const deleted = await mutations.deleteTransfer(transferId);

      if (deleted) void onWalletsChanged();
      return deleted;
    },
    [mutations.deleteTransfer, onWalletsChanged],
  );

  const detail = useTransferDetailDialog(transfers);
  const form = useTransferFormDialog({
    mutating: mutations.mutating,
    createTransfer: mutations.createTransfer,
    updateTransfer: mutations.updateTransfer,
    deleteTransfer: mutations.deleteTransfer,
    clearCreateState: mutations.clearCreateState,
    onWalletsChanged: () => void onWalletsChanged(),
  });

  const actions = createDashboardTransferActions({
    openDetail: detail.open,
    closeDetail: detail.close,
    openEdit: form.openEdit,
  });

  return { detail, form, ...actions, deleteTransfer };
}
