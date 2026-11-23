import { useCallback } from "react";

import {
  TransactionInput,
  TransactionValidationErrors,
} from "@/features/transactions/schemas/transaction.schema";
import {
  TransactionDetailDialog,
  useTransactionDetailDialog,
} from "@/features/transactions/hooks/use-transaction-detail-dialog";
import {
  TransactionFormDialog,
  useTransactionFormDialog,
} from "@/features/transactions/hooks/use-transaction-form-dialog";
import { Transaction } from "@/features/transactions/types/transaction.types";

import { createDashboardMovementActions } from "../utils/dashboard-movement-actions";

export interface DashboardMovementMutations {
  mutating: boolean;
  mutationError: string | null;
  mutationFieldErrors: TransactionValidationErrors;
  /** Required by the shared dialog, which the dashboard only opens in edit mode. */
  createTransaction: (input: TransactionInput) => Promise<boolean>;
  updateTransaction: (
    transactionId: string,
    input: TransactionInput,
  ) => Promise<boolean>;
  deleteTransaction: (transactionId: string) => Promise<boolean>;
  clearMutationState: () => void;
}

export interface UseDashboardMovementDialogsOptions {
  transactions: readonly Transaction[];
  mutations: DashboardMovementMutations;
  /** Refreshes the dashboard wallets so the totals follow the new balances. */
  onWalletsChanged: () => Promise<void> | void;
  /** A linked movement opens its shared expense instead of the personal detail. */
  onOpenSharedExpense: (expenseId: string) => void;
  /** A group-linked movement opens its group expense instead of the personal detail. */
  onOpenGroupExpense: (expenseId: string) => void;
  /** A group settlement income opens its group settlement instead of the personal detail. */
  onOpenGroupSettlement: (settlementId: string) => void;
  /** A settlement income opens its settlement detail instead of the personal one. */
  onOpenSettlement: (settlementId: string) => void;
}

export interface DashboardMovementDialogs {
  detail: TransactionDetailDialog;
  form: TransactionFormDialog;
  openDetail: (transaction: Transaction) => void;
  editFromDetail: (transaction: Transaction) => void;
  deleteTransaction: (transactionId: string) => Promise<boolean>;
}

/**
 * Reuses the movement detail and form dialogs from the movements feature, so
 * the dashboard behaves exactly like the movements screen without a second
 * implementation. The dashboard never opens the create form (TICKET-019).
 */
export function useDashboardMovementDialogs({
  transactions,
  mutations,
  onWalletsChanged,
  onOpenSharedExpense,
  onOpenGroupExpense,
  onOpenGroupSettlement,
  onOpenSettlement,
}: UseDashboardMovementDialogsOptions): DashboardMovementDialogs {
  // Edits and deletions change wallet balances, and the dashboard owns its own
  // `useWallets` instance, so refresh it to keep the totals in sync.
  const updateTransaction = useCallback(
    async (transactionId: string, input: TransactionInput) => {
      const updated = await mutations.updateTransaction(transactionId, input);

      if (updated) void onWalletsChanged();
      return updated;
    },
    [mutations.updateTransaction, onWalletsChanged],
  );
  const deleteTransaction = useCallback(
    async (transactionId: string) => {
      const deleted = await mutations.deleteTransaction(transactionId);

      if (deleted) void onWalletsChanged();
      return deleted;
    },
    [mutations.deleteTransaction, onWalletsChanged],
  );

  const detail = useTransactionDetailDialog(transactions);
  const form = useTransactionFormDialog({
    mutating: mutations.mutating,
    createTransaction: mutations.createTransaction,
    updateTransaction,
    deleteTransaction,
    clearMutationState: mutations.clearMutationState,
  });

  const actions = createDashboardMovementActions({
    clearMutationState: mutations.clearMutationState,
    openDetail: detail.open,
    closeDetail: detail.close,
    openEdit: form.openEdit,
    openSharedExpense: onOpenSharedExpense,
    openGroupExpense: onOpenGroupExpense,
    openGroupSettlement: onOpenGroupSettlement,
    openSettlement: onOpenSettlement,
  });

  return { detail, form, ...actions, deleteTransaction };
}
