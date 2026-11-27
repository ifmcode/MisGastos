import { useMemo } from "react";

import {
  TransferDetailDialog,
  useTransferDetailDialog,
} from "@/features/transfers/hooks/use-transfer-detail-dialog";
import {
  TransferFormDialog,
  useTransferFormDialog,
} from "@/features/transfers/hooks/use-transfer-form-dialog";
import { useTransfers } from "@/features/transfers/hooks/use-transfers";
import { TransferValidationErrors } from "@/features/transfers/schemas/transfer.schema";
import { Transfer } from "@/features/transfers/types/transfer.types";
import {
  TransferDialogActions,
  createTransferDialogActions,
} from "@/features/transfers/utils/transfer-dialog-actions";
import { getTransferHistoryItems } from "@/features/transfers/utils/transfer-history";
import { useWallets } from "@/features/wallets/hooks/use-wallets";
import { Wallet } from "@/features/wallets/types/wallet.types";
import { getActiveWallets } from "@/features/wallets/utils/wallet-status";

export interface TransferHistoryScreenController {
  transfers: Transfer[];
  wallets: Wallet[];
  activeWallets: Wallet[];
  walletMap: ReadonlyMap<string, Wallet>;
  loading: boolean;
  error: string | null;
  mutating: boolean;
  createError: string | null;
  createFieldErrors: TransferValidationErrors;
  detail: TransferDetailDialog;
  form: TransferFormDialog;
  openDetail: TransferDialogActions["openDetail"];
  editFromDetail: TransferDialogActions["editFromDetail"];
  deleteTransfer: (transferId: string) => Promise<boolean>;
  reload: () => void;
}

/** Coordinates the transfer history list with the shared transfer form. */
export function useTransferHistoryScreen(): TransferHistoryScreenController {
  const {
    wallets,
    loading: walletsLoading,
    error: walletsError,
    reload: reloadWallets,
  } = useWallets();
  const {
    transfers,
    loading: transfersLoading,
    mutating,
    error: transfersError,
    createError,
    createFieldErrors,
    reload,
    createTransfer,
    updateTransfer,
    deleteTransfer,
    clearCreateState,
  } = useTransfers();

  const activeWallets = useMemo(() => getActiveWallets(wallets), [wallets]);
  const walletMap = useMemo(
    () => new Map(wallets.map((wallet) => [wallet.id, wallet])),
    [wallets],
  );
  const historyTransfers = useMemo(
    () => getTransferHistoryItems(transfers),
    [transfers],
  );

  const form = useTransferFormDialog({
    mutating,
    createTransfer,
    updateTransfer,
    deleteTransfer,
    clearCreateState,
    onWalletsChanged: () => void reloadWallets(),
  });
  const detail = useTransferDetailDialog(transfers);
  const actions = createTransferDialogActions({
    openDetail: detail.open,
    closeDetail: detail.close,
    openEdit: form.openEdit,
  });

  // Deleting from the detail reverts wallet balances, so refresh them even
  // though this screen does not show them.
  async function deleteFromDetail(transferId: string): Promise<boolean> {
    const deleted = await deleteTransfer(transferId);

    if (deleted) void reloadWallets();
    return deleted;
  }

  return {
    transfers: historyTransfers,
    wallets,
    activeWallets,
    walletMap,
    loading: transfersLoading || walletsLoading,
    error: transfersError ?? walletsError,
    mutating,
    createError,
    createFieldErrors,
    detail,
    form,
    ...actions,
    deleteTransfer: deleteFromDetail,
    reload: () => {
      void reload();
      void reloadWallets();
    },
  };
}
