import { useCallback, useMemo, useState } from "react";

import { useFriendsOverview } from "@/features/friends/hooks/use-friends-overview";
import type { Friend } from "@/features/friends/types/friend.types";
import {
  findFriendByUid,
  getFriendDetailHeader,
  type FriendDetailHeader,
} from "@/features/friends/utils/friend-detail";
import { useProfile } from "@/features/profile/hooks/use-profile";
import type { SharedExpenseEditorController } from "@/features/shared-expenses/hooks/use-shared-expense-editor";
import type { SharedExpense } from "@/features/shared-expenses/types/shared-expense.types";
import { useAuth } from "@/hooks/use-auth";
import { DEFAULT_CURRENCY } from "@/shared/constants/currencies";
import type { UseConfirmDialogResult } from "@/shared/hooks/use-confirm-dialog";

import { useFriendDetailExpenses } from "./use-friend-detail-expenses";
import {
  useFriendRemoval,
  type FriendRemovalController,
} from "./use-friend-removal";

export type FriendDetailStatus = "loading" | "error" | "missing" | "ready";

export interface UseFriendDetailScreenOptions {
  /** Route uid, already normalized to a single string. */
  uid: string;
}

export interface FriendDetailScreenController {
  status: FriendDetailStatus;
  header: FriendDetailHeader | null;
  /** Friends of the overview, used by the expense rows to resolve names. */
  friends: Friend[];
  /**
   * Overview error: full-screen when there is no friend to show, background
   * banner when the header is already rendered.
   */
  error: string | null;
  refreshing: boolean;
  reload: () => void;
  refresh: () => void;
  expenses: SharedExpense[];
  expensesLoading: boolean;
  expensesError: string | null;
  reloadExpenses: () => void;
  /** Viewer uid, already normalized to a string for the expense rows. */
  viewerUid: string;
  /** Remaining friend/expense failures, each announced in its own banner. */
  removalError: string | null;
  expenseError: string | null;
  pendingId: string | null;
  requestDelete: (expense: SharedExpense) => void;
  deleteConfirm: UseConfirmDialogResult;
  editor: SharedExpenseEditorController;
  removal: FriendRemovalController;
}

/**
 * Composition root of the friend detail. Both lists are already loaded by the
 * Social hooks, so the pair is filtered in memory instead of adding a query.
 */
export function useFriendDetailScreen({
  uid,
}: UseFriendDetailScreenOptions): FriendDetailScreenController {
  const { user } = useAuth();
  const viewerUid = user?.uid;
  const { profile } = useProfile();
  const overview = useFriendsOverview({ viewerUid });
  const [refreshing, setRefreshing] = useState(false);

  const friend = useMemo(
    () => findFriendByUid(overview.overview.friends, uid),
    [overview.overview.friends, uid],
  );
  const header = useMemo(
    () => (friend ? getFriendDetailHeader(friend) : null),
    [friend],
  );

  const expenses = useFriendDetailExpenses({
    viewerUid,
    friends: overview.overview.friends,
    friend,
    preferredCurrency: profile?.preferredCurrency ?? DEFAULT_CURRENCY,
    onFriendsChanged: overview.refresh,
  });

  const removal = useFriendRemoval({
    viewerUid,
    friend,
    onChanged: overview.refresh,
  });

  const reload = useCallback(() => {
    void overview.reload();
    expenses.reload();
  }, [expenses.reload, overview.reload]);

  // One pull-to-refresh flag for both sources: `useSharedExpenseList` exposes
  // `refresh` but not its own refreshing state.
  const refresh = useCallback(() => {
    setRefreshing(true);
    void Promise.all([overview.refresh(), expenses.refresh()]).finally(() => {
      setRefreshing(false);
    });
  }, [expenses.refresh, overview.refresh]);

  // Only the overview decides whether the uid exists: an expense failure must
  // not turn a removed/unknown friend into a full load error.
  const status: FriendDetailStatus = header
    ? "ready"
    : overview.loading
      ? "loading"
      : overview.error
        ? "error"
        : "missing";

  return {
    status,
    header,
    friends: overview.overview.friends,
    error: overview.error,
    refreshing,
    reload,
    refresh,
    expenses: expenses.expenses,
    expensesLoading: expenses.loading,
    expensesError: expenses.error,
    reloadExpenses: expenses.reload,
    viewerUid: viewerUid ?? "",
    removalError: removal.error,
    expenseError: expenses.actionError,
    pendingId: expenses.pendingId,
    requestDelete: expenses.requestDelete,
    deleteConfirm: expenses.deleteConfirm,
    editor: expenses.editor,
    removal,
  };
}
