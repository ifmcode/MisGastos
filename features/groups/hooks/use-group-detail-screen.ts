import { useCallback, useState } from "react";

import { useFriendsOverview } from "@/features/friends/hooks/use-friends-overview";
import { useGroupBalances } from "@/features/group-expenses/hooks/use-group-balances";
import { useGroupDetailSettlements } from "@/features/group-expenses/hooks/use-group-detail-settlements";
import { useProfile } from "@/features/profile/hooks/use-profile";
import { useAuth } from "@/hooks/use-auth";
import { DEFAULT_CURRENCY } from "@/shared/constants/currencies";

import { getGroupDetailStatus } from "../utils/group-detail-status";
import type {
  GroupDetailScreenController,
  UseGroupDetailScreenOptions,
} from "./group-detail-screen.types";
import { useGroupDetail } from "./use-group-detail";
import { useGroupDetailExpenses } from "./use-group-detail-expenses";
import { useGroupDetailMembership } from "./use-group-detail-membership";
import { useGroupEditor } from "./use-group-editor";
import { useGroupInviteMembers } from "./use-group-invite-members";

export type {
  GroupDetailScreenController,
  UseGroupDetailScreenOptions,
} from "./group-detail-screen.types";
export type { GroupDetailStatus } from "../utils/group-detail-status";

/** Composition root of `/social/groups/[groupId]`. */
export function useGroupDetailScreen({
  groupId,
}: UseGroupDetailScreenOptions): GroupDetailScreenController {
  const { user } = useAuth();
  const viewerUid = user?.uid;
  const { profile } = useProfile();
  const friendsOverview = useFriendsOverview({ viewerUid });
  const friendsRefresh = friendsOverview.refresh;
  const groupDetail = useGroupDetail({ viewerUid, groupId });
  const { detail, reload } = groupDetail;
  const detailRefresh = groupDetail.refresh;
  const balances = useGroupBalances({ viewerUid, groupId });
  const refreshBalances = balances.refresh;
  const settlements = useGroupDetailSettlements({ viewerUid, groupId });
  const refreshSettlements = settlements.refresh;
  const [detailsVisible, setDetailsVisible] = useState(false);
  const preferredCurrency = profile?.preferredCurrency ?? DEFAULT_CURRENCY;

  // A saved expense, group setting or membership change can move the balances,
  // so they refresh silently next to the detail reload.
  const onGroupChanged = useCallback(() => {
    reload();
    void refreshBalances();
  }, [refreshBalances, reload]);

  const expenses = useGroupDetailExpenses({
    viewerUid,
    groupId,
    detail,
    preferredCurrency,
    registerInWalletByDefault:
      profile?.registerSharedExpensesInWallet ?? false,
    onGroupChanged,
  });
  const expensesRefresh = expenses.refresh;

  const refresh = useCallback(() => {
    void Promise.all([
      detailRefresh(),
      friendsRefresh(),
      expensesRefresh(),
      refreshBalances(),
      refreshSettlements(),
    ]);
  }, [
    detailRefresh,
    expensesRefresh,
    friendsRefresh,
    refreshBalances,
    refreshSettlements,
  ]);

  const editor = useGroupEditor({
    viewerUid,
    preferredCurrency,
    onSaved: onGroupChanged,
  });

  const invite = useGroupInviteMembers({
    viewerUid,
    detail,
    friends: friendsOverview.overview.friends,
    friendsLoading: friendsOverview.loading,
    friendsError: friendsOverview.error,
    retryFriends: friendsOverview.reload,
    onInvited: reload,
  });

  const membership = useGroupDetailMembership({
    viewerUid,
    groupId,
    detail,
    onChanged: onGroupChanged,
  });

  const openDetails = useCallback(() => setDetailsVisible(true), []);
  const closeDetails = useCallback(() => setDetailsVisible(false), []);

  const status = getGroupDetailStatus(groupDetail, detail !== null);

  return {
    ...membership,
    status,
    detail,
    viewerUid: viewerUid ?? "",
    friends: friendsOverview.overview.friends,
    isOwner: detail ? detail.group.ownerId === viewerUid : false,
    error: groupDetail.error,
    refreshing:
      groupDetail.refreshing || friendsOverview.refreshing || balances.refreshing,
    detailsVisible,
    editor,
    expenses,
    balances,
    settlements,
    invite,
    reload,
    refresh,
    openDetails,
    closeDetails,
  };
}
