import { useCallback, useState } from "react";

import { useFriendsOverview } from "@/features/friends/hooks/use-friends-overview";
import type { Friend } from "@/features/friends/types/friend.types";
import { useProfile } from "@/features/profile/hooks/use-profile";
import { useAuth } from "@/hooks/use-auth";
import { DEFAULT_CURRENCY } from "@/shared/constants/currencies";

import type { GroupDetail } from "../types/group.types";
import { useGroupDetail } from "./use-group-detail";
import {
  useGroupDetailExpenses,
  type GroupDetailExpensesController,
} from "./use-group-detail-expenses";
import {
  useGroupDetailMembership,
  type GroupDetailMembershipController,
} from "./use-group-detail-membership";
import { useGroupEditor, type GroupEditorController } from "./use-group-editor";
import {
  useGroupInviteMembers,
  type GroupInviteMembersController,
} from "./use-group-invite-members";

export type GroupDetailStatus = "loading" | "error" | "missing" | "ready";

export interface UseGroupDetailScreenOptions {
  groupId: string;
}

export interface GroupDetailScreenController
  extends GroupDetailMembershipController {
  status: GroupDetailStatus;
  detail: GroupDetail | null;
  viewerUid: string;
  friends: Friend[];
  isOwner: boolean;
  error: string | null;
  refreshing: boolean;
  detailsVisible: boolean;
  editor: GroupEditorController;
  expenses: GroupDetailExpensesController;
  invite: GroupInviteMembersController;
  reload: () => void;
  refresh: () => void;
  openDetails: () => void;
  closeDetails: () => void;
}

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
  const [detailsVisible, setDetailsVisible] = useState(false);
  const preferredCurrency = profile?.preferredCurrency ?? DEFAULT_CURRENCY;

  const expenses = useGroupDetailExpenses({
    viewerUid,
    groupId,
    detail,
    preferredCurrency,
    onGroupChanged: reload,
  });
  const expensesRefresh = expenses.refresh;

  const refresh = useCallback(() => {
    void Promise.all([detailRefresh(), friendsRefresh(), expensesRefresh()]);
  }, [detailRefresh, expensesRefresh, friendsRefresh]);

  const editor = useGroupEditor({
    viewerUid,
    preferredCurrency,
    onSaved: reload,
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
    onChanged: reload,
  });

  const openDetails = useCallback(() => setDetailsVisible(true), []);
  const closeDetails = useCallback(() => setDetailsVisible(false), []);

  const status: GroupDetailStatus = groupDetail.missing
    ? "missing"
    : detail
      ? "ready"
      : groupDetail.loading
        ? "loading"
        : groupDetail.error
          ? "error"
          : "missing";

  return {
    ...membership,
    status,
    detail,
    viewerUid: viewerUid ?? "",
    friends: friendsOverview.overview.friends,
    isOwner: detail ? detail.group.ownerId === viewerUid : false,
    error: groupDetail.error,
    refreshing: groupDetail.refreshing || friendsOverview.refreshing,
    detailsVisible,
    editor,
    expenses,
    invite,
    reload,
    refresh,
    openDetails,
    closeDetails,
  };
}
