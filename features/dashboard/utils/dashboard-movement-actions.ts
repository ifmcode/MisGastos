import { Transaction } from "@/features/transactions/types/transaction.types";

export interface DashboardMovementDialogPort {
  clearMutationState: () => void;
  openDetail: (transaction: Transaction) => void;
  closeDetail: () => void;
  openEdit: (transaction: Transaction) => void;
}

export interface DashboardMovementActions {
  /** Opens the detail without a stale mutation error from a previous attempt. */
  openDetail: (transaction: Transaction) => void;
  /** Closes the read-only detail before the edit form replaces it. */
  editFromDetail: (transaction: Transaction) => void;
}

/**
 * Keeps the dashboard movement callbacks in one place: a recent movement opens
 * the shared detail and its pencil hands the movement over to the shared form.
 */
export function createDashboardMovementActions(
  port: DashboardMovementDialogPort,
): DashboardMovementActions {
  return {
    openDetail: (transaction) => {
      port.clearMutationState();
      port.openDetail(transaction);
    },
    editFromDetail: (transaction) => {
      port.closeDetail();
      port.openEdit(transaction);
    },
  };
}
