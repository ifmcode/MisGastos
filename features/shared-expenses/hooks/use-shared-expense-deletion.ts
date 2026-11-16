import { useCallback, useState } from "react";

import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { getSharedExpenseErrorCode } from "../services/shared-expense.errors";
import type { SharedExpense } from "../types/shared-expense.types";
import { useSharedExpensesService } from "./use-shared-expenses-service";

export interface UseSharedExpenseDeletionOptions {
  viewerUid: string | undefined;
  /** Reloads the affected lists and balances after a successful delete. */
  onDeleted: () => void | Promise<void>;
}

export interface SharedExpenseDeletionController {
  /** Id of the expense with a delete in flight, if any. */
  pendingId: string | null;
  actionError: string | null;
  /**
   * Single-flight delete: resolves true when the expense disappeared and false
   * when the mutation failed, so the caller only leaves the detail on success.
   */
  deleteExpense: (expense: SharedExpense) => Promise<boolean>;
}

/**
 * Single-flight deletion of one expense. The caller owns the confirmation, so
 * the shared detail dialog and any list surface reuse the same mutation path.
 */
export function useSharedExpenseDeletion({
  viewerUid,
  onDeleted,
}: UseSharedExpenseDeletionOptions): SharedExpenseDeletionController {
  const service = useSharedExpensesService();
  const { tr } = useScopedTranslation("sharedExpenses");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const deleteExpense = useCallback(
    async (expense: SharedExpense) => {
      if (!viewerUid) {
        setActionError(tr("errors.SIGN_IN_REQUIRED"));
        return false;
      }

      setPendingId(expense.id);
      setActionError(null);

      try {
        await service.deleteExpense(viewerUid, expense.id);
        await onDeleted();
        return true;
      } catch (error: unknown) {
        setActionError(
          tr(`errors.${getSharedExpenseErrorCode(error, "DELETE_FAILED")}`),
        );
        return false;
      } finally {
        setPendingId(null);
      }
    },
    [onDeleted, service, tr, viewerUid],
  );

  return {
    pendingId,
    actionError,
    deleteExpense,
  };
}
