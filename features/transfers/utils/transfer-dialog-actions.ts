import { Transfer } from "../types/transfer.types";

export interface TransferDialogPort {
  openDetail: (transfer: Transfer) => void;
  closeDetail: () => void;
  openEdit: (transfer: Transfer) => void;
}

export interface TransferDialogActions {
  /** Opens the read-only detail from a transfer row. */
  openDetail: (transfer: Transfer) => void;
  /** Closes the detail before the shared form replaces it. */
  editFromDetail: (transfer: Transfer) => void;
}

/**
 * Keeps every transfer entry point consistent: a row opens the shared read-only
 * detail and its pencil hands the transfer over to the shared form.
 */
export function createTransferDialogActions(
  port: TransferDialogPort,
): TransferDialogActions {
  return {
    openDetail: (transfer) => port.openDetail(transfer),
    editFromDetail: (transfer) => {
      port.closeDetail();
      port.openEdit(transfer);
    },
  };
}
