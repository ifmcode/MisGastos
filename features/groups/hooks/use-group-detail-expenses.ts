import { useCallback } from "react";

import {
  useGroupExpenseEditor,
  type GroupExpenseEditorController,
} from "@/features/group-expenses/hooks/use-group-expense-editor";
import { useGroupExpenses } from "@/features/group-expenses/hooks/use-group-expenses";
import type { GroupExpense } from "@/features/group-expenses/types/group-expense.types";
import type { CurrencyCode } from "@/shared/constants/currencies";

import type { GroupDetail } from "../types/group.types";

export interface UseGroupDetailExpensesOptions {
  viewerUid: string | undefined;
  groupId: string;
  /** Already-loaded detail: its members feed the form without a second read. */
  detail: GroupDetail | null;
  preferredCurrency: CurrencyCode;
  /** Stored profile preference of new expenses (`registerSharedExpensesInWallet`). */
  registerInWalletByDefault: boolean;
  /** Reloads the group detail after a save. */
  onGroupChanged: () => void;
}

export interface GroupDetailExpensesController {
  expenses: GroupExpense[];
  loading: boolean;
  error: string | null;
  retry: () => void;
  refresh: () => Promise<void>;
  editor: GroupExpenseEditorController;
}

/** Expenses section of the group detail and its create/edit page sheet. */
export function useGroupDetailExpenses({
  viewerUid,
  groupId,
  detail,
  preferredCurrency,
  registerInWalletByDefault,
  onGroupChanged,
}: UseGroupDetailExpensesOptions): GroupDetailExpensesController {
  const list = useGroupExpenses({ viewerUid, groupId });
  const reloadList = list.reload;
  const refreshList = list.refresh;

  // A save reloads the detail (member names, read-only state) but only a silent
  // refresh of the list, so the section never flashes its loading state.
  const onSaved = useCallback(() => {
    onGroupChanged();
    void refreshList();
  }, [onGroupChanged, refreshList]);

  const editor = useGroupExpenseEditor({
    viewerUid,
    groups: [],
    lockedDetail: detail,
    preferredCurrency,
    registerInWalletByDefault,
    onSaved,
  });

  return {
    expenses: list.expenses,
    loading: list.loading,
    error: list.error,
    retry: reloadList,
    refresh: list.refresh,
    editor,
  };
}
