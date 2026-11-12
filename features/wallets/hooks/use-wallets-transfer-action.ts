import {
  useTransfers,
  UseTransfersResult,
} from "@/features/transfers/hooks/use-transfers";
import {
  TransferFormDialog,
  useTransferFormDialog,
} from "@/features/transfers/hooks/use-transfer-form-dialog";

export interface WalletsTransferAction {
  transfers: UseTransfersResult;
  form: TransferFormDialog;
}

/**
 * Bundles the shared transfer collection, the create/edit dialog and the wallet
 * refresh so the wallets tab reuses the exact flow of the dashboard and history.
 */
export function useWalletsTransferAction(
  onWalletsChanged: () => void,
): WalletsTransferAction {
  const transfers = useTransfers();
  const form = useTransferFormDialog({
    mutating: transfers.mutating,
    createTransfer: transfers.createTransfer,
    updateTransfer: transfers.updateTransfer,
    deleteTransfer: transfers.deleteTransfer,
    clearCreateState: transfers.clearCreateState,
    onWalletsChanged,
  });

  return { transfers, form };
}
