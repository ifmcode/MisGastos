import { useCallback, useState } from "react";

import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { getGroupExpenseErrorCode } from "../services/group-expense.errors";
import type { GroupExpense } from "../types/group-expense.types";
import { useGroupExpensesService } from "./use-group-expenses-service";

export interface UseGroupExpenseDeletionOptions {
  viewerUid: string | undefined;
  /** Refreshes the group detail after a successful delete. */
  onDeleted: () => void | Promise<void>;
}

export interface GroupExpenseDeletionController {
  /** Id of the expense with a delete in flight, if any. */
  pendingId: string | null;
  actionError: string | null;
  /**
   * Single-flight delete: resolves true when the expense disappeared and false
   * when the mutation failed, so the caller only leaves the detail on success.
   */
  deleteExpense: (expense: GroupExpense) => Promise<boolean>;
}

/**
 * Single-flight deletion of one group expense. The caller owns the
 * confirmation, so the detail route reuses the shared `useDetailActions` flow.
 */
export function useGroupExpenseDeletion({
  viewerUid,
  onDeleted,
}: UseGroupExpenseDeletionOptions): GroupExpenseDeletionController {
  const service = useGroupExpensesService();
  const { tr } = useScopedTranslation("groupExpenses");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const deleteExpense = useCallback(
    async (expense: GroupExpense) => {
      if (!viewerUid) {
        setActionError(tr("errors.SIGN_IN_REQUIRED"));
        return false;
      }

      setPendingId(expense.id);
      setActionError(null);

      try {
        await service.deleteGroupExpense(viewerUid, expense.id);
        await onDeleted();
        return true;
      } catch (error: unknown) {
        setActionError(
          tr(`errors.${getGroupExpenseErrorCode(error, "DELETE_FAILED")}`),
        );
        return false;
      } finally {
        setPendingId(null);
      }
    },
    [onDeleted, service, tr, viewerUid],
  );

  return { pendingId, actionError, deleteExpense };
}
