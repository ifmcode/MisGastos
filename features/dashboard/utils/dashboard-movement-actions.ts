import { Transaction } from "@/features/transactions/types/transaction.types";

export interface DashboardMovementDialogPort {
  clearMutationState: () => void;
  openDetail: (transaction: Transaction) => void;
  closeDetail: () => void;
  openEdit: (transaction: Transaction) => void;
  /** Linked movements live in the social feature, not in the personal detail. */
  openSharedExpense: (expenseId: string) => void;
  /** The linked settlement income opens its settlement detail too. */
  openSettlement: (settlementId: string) => void;
}

export interface DashboardMovementActions {
  /**
   * Opens the detail without a stale mutation error from a previous attempt, or
   * navigates to the linked record when the movement carries a link.
   */
  openDetail: (transaction: Transaction) => void;
  /** Closes the read-only detail before the edit form replaces it. */
  editFromDetail: (transaction: Transaction) => void;
}

/**
 * Keeps the dashboard movement callbacks in one place: a recent movement opens
 * the shared detail and its pencil hands the movement over to the shared form.
 * A linked movement never opens the personal detail, so no edit or delete is
 * reachable from the dashboard for it.
 */
export function createDashboardMovementActions(
  port: DashboardMovementDialogPort,
): DashboardMovementActions {
  return {
    openDetail: (transaction) => {
      if (transaction.settlementId) {
        port.openSettlement(transaction.settlementId);
        return;
      }

      if (transaction.sharedExpenseId) {
        port.openSharedExpense(transaction.sharedExpenseId);
        return;
      }

      port.clearMutationState();
      port.openDetail(transaction);
    },
    editFromDetail: (transaction) => {
      port.closeDetail();
      port.openEdit(transaction);
    },
  };
}
