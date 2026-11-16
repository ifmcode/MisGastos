import { useCallback, useMemo } from "react";

import type { Friend } from "@/features/friends/types/friend.types";
import {
  useSharedExpenseEditor,
  type SharedExpenseEditorController,
} from "@/features/shared-expenses/hooks/use-shared-expense-editor";
import { useSharedExpenseList } from "@/features/shared-expenses/hooks/use-shared-expense-list";
import type { SharedExpense } from "@/features/shared-expenses/types/shared-expense.types";
import { getFriendExpenses } from "@/features/shared-expenses/utils/friend-expenses";
import type { CurrencyCode } from "@/shared/constants/currencies";

export interface UseFriendDetailExpensesOptions {
  viewerUid: string | undefined;
  friends: readonly Friend[];
  friend: Friend | null;
  preferredCurrency: CurrencyCode;
  /** Balances live in the friends overview, so mutations must reload it too. */
  onFriendsChanged: () => void | Promise<void>;
}

export interface FriendDetailExpensesController {
  expenses: SharedExpense[];
  loading: boolean;
  error: string | null;
  reload: () => void;
  refresh: () => Promise<void>;
  editor: SharedExpenseEditorController;
}

/**
 * Pair expenses of the detail: the viewer's list filtered in memory plus the
 * preselected create/edit form. Delete and edit-detail live in the expense
 * route (TICKET-043), so this hook only keeps the list and the create form.
 */
export function useFriendDetailExpenses({
  viewerUid,
  friends,
  friend,
  preferredCurrency,
  onFriendsChanged,
}: UseFriendDetailExpensesOptions): FriendDetailExpensesController {
  const list = useSharedExpenseList({ viewerUid });

  const onChanged = useCallback(() => {
    void list.refresh();
    void onFriendsChanged();
  }, [list.refresh, onFriendsChanged]);

  const editor = useSharedExpenseEditor({
    viewerUid,
    friends,
    preferredCurrency,
    lockedFriendUid: friend?.uid,
    onSaved: onChanged,
  });

  const expenses = useMemo(
    () => getFriendExpenses(list.expenses, viewerUid ?? "", friend?.uid ?? ""),
    [friend, list.expenses, viewerUid],
  );

  return {
    expenses,
    loading: list.loading,
    error: list.error,
    reload: list.reload,
    refresh: list.refresh,
    editor,
  };
}
