import { useCallback, useMemo, useState } from "react";

import { useFriendsOverview } from "@/features/friends/hooks/use-friends-overview";
import {
  findFriendByUid,
  getFriendDetailHeader,
} from "@/features/friends/utils/friend-detail";
import { useProfile } from "@/features/profile/hooks/use-profile";
import { useAuth } from "@/hooks/use-auth";
import { DEFAULT_CURRENCY } from "@/shared/constants/currencies";

import type {
  FriendDetailScreenController,
  FriendDetailStatus,
  UseFriendDetailScreenOptions,
} from "../types/friend-detail-screen.types";
import { buildFriendTimelineGroups } from "../utils/friend-timeline-settled";
import { useFriendDetailExpenses } from "./use-friend-detail-expenses";
import { useFriendDetailSettlements } from "./use-friend-detail-settlements";
import { useFriendRemoval } from "./use-friend-removal";

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
    registerSharedExpensesInWallet:
      profile?.registerSharedExpensesInWallet ?? false,
    onFriendsChanged: overview.refresh,
  });

  const removal = useFriendRemoval({
    viewerUid,
    friend,
    onChanged: overview.refresh,
  });

  const settlements = useFriendDetailSettlements({ viewerUid, friend });

  // No new query: both pair lists are already loaded, so the split is pure.
  const groups = useMemo(
    () =>
      buildFriendTimelineGroups({
        expenses: expenses.expenses,
        settlements: settlements.settlements,
        viewerUid: viewerUid ?? "",
        friendUid: friend?.uid ?? "",
      }),
    [expenses.expenses, friend?.uid, settlements.settlements, viewerUid],
  );

  const boundaryId = groups.boundary?.id ?? null;
  const [expandedBoundaryId, setExpandedBoundaryId] = useState<string | null>(
    null,
  );

  // Derived, not reset in an effect: a new full settlement changes the boundary
  // id and the flag falls back to collapsed on the same render, with no frame of
  // the previous cycle open. A new expense keeps the boundary, so an explicit
  // expansion survives it.
  const showSettled = boundaryId !== null && expandedBoundaryId === boundaryId;

  const toggleSettled = useCallback(() => {
    if (groups.settled.length === 0) return;

    setExpandedBoundaryId((current) =>
      current === boundaryId ? null : boundaryId,
    );
  }, [boundaryId, groups.settled.length]);

  const reloadTimeline = useCallback(() => {
    expenses.reload();
    settlements.reload();
  }, [expenses.reload, settlements.reload]);

  const reload = useCallback(() => {
    void overview.reload();
    expenses.reload();
    settlements.reload();
  }, [expenses.reload, overview.reload, settlements.reload]);

  // One pull-to-refresh flag for all sources: `useSharedExpenseList` exposes
  // `refresh` but not its own refreshing state.
  const refresh = useCallback(() => {
    setRefreshing(true);
    void Promise.all([
      overview.refresh(),
      expenses.refresh(),
      settlements.refresh(),
    ]).finally(() => {
      setRefreshing(false);
    });
  }, [expenses.refresh, overview.refresh, settlements.refresh]);

  // Only the overview decides whether the uid exists: an expense failure must
  // not turn a removed/unknown friend into a full load error.
  const status: FriendDetailStatus = header
    ? "ready"
    : overview.loading ? "loading" : overview.error ? "error" : "missing";

  return {
    status,
    header,
    friends: overview.overview.friends,
    error: overview.error,
    refreshing,
    reload,
    refresh,
    timelineCurrent: groups.current,
    timelineSettled: groups.settled,
    timelineLoading: expenses.loading || settlements.loading,
    timelineError: expenses.error ?? settlements.error,
    reloadTimeline,
    showSettled,
    toggleSettled,
    viewerUid: viewerUid ?? "",
    removalError: removal.error,
    editor: expenses.editor,
    removal,
  };
}
