import { useCallback, useState } from "react";

import {
  useConfirmDialog,
  type UseConfirmDialogResult,
} from "@/shared/hooks/use-confirm-dialog";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { getSharedExpenseErrorCode } from "../services/shared-expense.errors";
import type { SharedExpense } from "../types/shared-expense.types";
import { useSharedExpensesService } from "./use-shared-expenses-service";

export interface UseSharedExpenseDeletionOptions {
  viewerUid: string | undefined;
  /** Reloads the list and the affected balances after a successful delete. */
  onDeleted: () => void | Promise<void>;
}

export interface SharedExpenseDeletionController {
  /** Id of the expense with a delete in flight, if any. */
  pendingId: string | null;
  actionError: string | null;
  requestDelete: (expense: SharedExpense) => void;
  confirm: UseConfirmDialogResult;
}

/** Single-flight deletion of one expense behind a confirmation dialog. */
export function useSharedExpenseDeletion({
  viewerUid,
  onDeleted,
}: UseSharedExpenseDeletionOptions): SharedExpenseDeletionController {
  const service = useSharedExpensesService();
  const { t, tr } = useScopedTranslation("sharedExpenses");
  const confirm = useConfirmDialog();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const { open } = confirm;

  const remove = useCallback(
    async (expense: SharedExpense) => {
      if (!viewerUid) {
        setActionError(tr("errors.SIGN_IN_REQUIRED"));
        return;
      }

      setPendingId(expense.id);
      setActionError(null);

      try {
        await service.deleteExpense(viewerUid, expense.id);
        await onDeleted();
      } catch (error: unknown) {
        setActionError(
          tr(`errors.${getSharedExpenseErrorCode(error, "DELETE_FAILED")}`),
        );
      } finally {
        setPendingId(null);
      }
    },
    [onDeleted, service, tr, viewerUid],
  );

  const requestDelete = useCallback(
    (expense: SharedExpense) => {
      open({
        title: t("deleteDialog.title"),
        message: t("deleteDialog.message", {
          description: expense.description,
        }),
        confirmLabel: t("deleteDialog.confirm"),
        cancelLabel: t("deleteDialog.cancel"),
        onConfirm: () => {
          void remove(expense);
        },
      });
    },
    [open, remove, t],
  );

  return {
    pendingId,
    actionError,
    requestDelete,
    confirm,
  };
}
