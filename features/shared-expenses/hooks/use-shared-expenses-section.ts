import { useCallback, useEffect, useRef, useState } from "react";

import type { Friend } from "@/features/friends/types/friend.types";
import type { CurrencyCode } from "@/shared/constants/currencies";
import { useAuth } from "@/hooks/use-auth";
import {
  useConfirmDialog,
  type UseConfirmDialogResult,
} from "@/shared/hooks/use-confirm-dialog";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { getSharedExpenseErrorCode } from "../services/shared-expense.errors";
import type { SharedExpense } from "../types/shared-expense.types";
import { useSharedExpenseEditor } from "./use-shared-expense-editor";
import { useSharedExpenseList } from "./use-shared-expense-list";
import { useSharedExpensesService } from "./use-shared-expenses-service";

export interface UseSharedExpensesSectionOptions {
  friends: readonly Friend[];
  preferredCurrency: CurrencyCode;
  onBalancesChanged: () => void;
  /** Pull-to-refresh of the parent screen; the expenses reload on its falling edge. */
  refreshing: boolean;
}

export interface SharedExpensesSectionController {
  viewerUid: string | undefined;
  loading: boolean;
  error: string | null;
  actionError: string | null;
  expenses: SharedExpense[];
  editor: ReturnType<typeof useSharedExpenseEditor>;
  pendingId: string | null;
  reload: () => void;
  requestDelete: (expense: SharedExpense) => void;
  confirm: UseConfirmDialogResult;
}

/** Composition root of the shared-expenses section of the friends tab. */
export function useSharedExpensesSection({
  friends,
  preferredCurrency,
  onBalancesChanged,
  refreshing,
}: UseSharedExpensesSectionOptions): SharedExpensesSectionController {
  const { user } = useAuth();
  const viewerUid = user?.uid;
  const service = useSharedExpensesService();
  const { t, tr } = useScopedTranslation("sharedExpenses");
  const list = useSharedExpenseList({ viewerUid });
  const { refresh, setActionError } = list;
  const confirm = useConfirmDialog();
  const [pendingId, setPendingId] = useState<string | null>(null);

  // The parent screen owns the RefreshControl, so the expenses follow its
  // falling edge instead of mounting a second one inside the ScrollView.
  const wasRefreshing = useRef(refreshing);
  useEffect(() => {
    if (wasRefreshing.current && !refreshing) {
      void refresh();
    }
    wasRefreshing.current = refreshing;
  }, [refreshing, refresh]);

  const editor = useSharedExpenseEditor({
    viewerUid,
    friends,
    preferredCurrency,
    onSaved: () => {
      void refresh();
      onBalancesChanged();
    },
  });

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
        await refresh();
        onBalancesChanged();
      } catch (error: unknown) {
        setActionError(
          tr(`errors.${getSharedExpenseErrorCode(error, "DELETE_FAILED")}`),
        );
      } finally {
        setPendingId(null);
      }
    },
    [onBalancesChanged, refresh, service, setActionError, tr, viewerUid],
  );

  const requestDelete = useCallback(
    (expense: SharedExpense) => {
      confirm.open({
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
    [confirm, remove, t],
  );

  return {
    viewerUid,
    loading: list.loading,
    error: list.error,
    actionError: list.actionError,
    expenses: list.expenses,
    editor,
    pendingId,
    reload: list.reload,
    requestDelete,
    confirm,
  };
}
