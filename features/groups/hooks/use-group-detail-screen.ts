import { useCallback } from "react";

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
import { useGroupActivityFeed } from "./use-group-activity-feed";
import { useGroupDetail } from "./use-group-detail";
import { useGroupDetailExpenses } from "./use-group-detail-expenses";
import { useGroupDetailMembership } from "./use-group-detail-membership";
import { useGroupDetailSheetController } from "./use-group-detail-sheet-controller";
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
  onLeft,
  onOpenSettle,
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
  const activity = useGroupActivityFeed({ viewerUid, groupId });
  const reloadActivity = activity.reload;
  const refreshActivity = activity.refresh;
  const preferredCurrency = profile?.preferredCurrency ?? DEFAULT_CURRENCY;
  const sheet = useGroupDetailSheetController({ onLeft, onOpenSettle });

  // A mutation can move the balances and append activity: reload both silently.
  const onGroupChanged = useCallback(() => {
    reload();
    void refreshBalances();
    reloadActivity();
  }, [refreshBalances, reload, reloadActivity]);

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

  // A transfer changes the timeline roles, so reload expenses and settlements.
  const onMembershipChanged = useCallback(() => {
    onGroupChanged();
    void expensesRefresh();
    void refreshSettlements();
  }, [expensesRefresh, onGroupChanged, refreshSettlements]);

  const refresh = useCallback(() => {
    void Promise.all([
      detailRefresh(),
      friendsRefresh(),
      expensesRefresh(),
      refreshBalances(),
      refreshSettlements(),
      refreshActivity(),
    ]);
  }, [
    detailRefresh,
    expensesRefresh,
    friendsRefresh,
    refreshActivity,
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
    balances: balances.balances,
    onChanged: onMembershipChanged,
    onLeft: sheet.handleLeft,
    onOpenSettle: sheet.openSettleFromDialog,
  });

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
      groupDetail.refreshing ||
      friendsOverview.refreshing ||
      balances.refreshing ||
      activity.refreshing,
    detailsVisible: sheet.detailsVisible,
    editor,
    expenses,
    balances,
    settlements,
    activity,
    invite,
    reload,
    refresh,
    openDetails: sheet.openDetails,
    closeDetails: sheet.closeDetails,
  };
}
