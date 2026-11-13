import { Transfer } from "@/features/transfers/types/transfer.types";

export interface DashboardTransferDialogPort {
  openDetail: (transfer: Transfer) => void;
  closeDetail: () => void;
  openEdit: (transfer: Transfer) => void;
}

export interface DashboardTransferActions {
  /** Opens the read-only detail from a recent transfer. */
  openDetail: (transfer: Transfer) => void;
  /** Closes the detail before the shared form replaces it. */
  editFromDetail: (transfer: Transfer) => void;
}

/**
 * Keeps the dashboard transfer callbacks in one place: a recent transfer opens
 * the shared detail and its pencil hands the transfer over to the shared form.
 */
export function createDashboardTransferActions(
  port: DashboardTransferDialogPort,
): DashboardTransferActions {
  return {
    openDetail: (transfer) => port.openDetail(transfer),
    editFromDetail: (transfer) => {
      port.closeDetail();
      port.openEdit(transfer);
    },
  };
}
