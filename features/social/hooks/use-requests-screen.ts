import { useCallback, useMemo } from "react";

import { useFriendActions } from "@/features/friends/hooks/use-friend-actions";
import { useFriendsOverview } from "@/features/friends/hooks/use-friends-overview";
import type { FriendRequestItem } from "@/features/friends/types/friend.types";
import {
  useGroupInvitationActions,
  type GroupInvitationResponse,
} from "@/features/groups/hooks/use-group-invitation-actions";
import { useGroupInvitations } from "@/features/groups/hooks/use-group-invitations";
import type { PendingGroupInvitationItem } from "@/features/groups/types/group.types";
import { useAuth } from "@/hooks/use-auth";

import { getPendingRequests } from "../utils/pending-requests";

export interface RequestsScreenController {
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  actionError: string | null;
  pendingId: string | null;
  friendTotal: number;
  groupTotal: number;
  total: number;
  incoming: FriendRequestItem[];
  outgoing: FriendRequestItem[];
  groupInvitations: PendingGroupInvitationItem[];
  groupsLoading: boolean;
  groupError: string | null;
  groupActionError: string | null;
  groupPendingId: string | null;
  groupPendingAction: GroupInvitationResponse | null;
  reload: () => void;
  refresh: () => void;
  reloadGroups: () => void;
  acceptRequest: (requestId: string) => void;
  rejectRequest: (requestId: string) => void;
  cancelRequest: (requestId: string) => void;
  acceptInvitation: (invitationId: string) => void;
  rejectInvitation: (invitationId: string) => void;
}

/** `social/requests`: friend requests plus the received group invitations. */
export function useRequestsScreen(): RequestsScreenController {
  const { user } = useAuth();
  const viewerUid = user?.uid;
  const {
    overview,
    loading,
    refreshing,
    error,
    reload,
    refresh,
  } = useFriendsOverview({ viewerUid });
  const actions = useFriendActions({ viewerUid, onChanged: refresh });
  const groupInvitations = useGroupInvitations({ viewerUid });
  const { removeInvitation } = groupInvitations;
  const groupActions = useGroupInvitationActions({
    viewerUid,
    onResponded: removeInvitation,
  });
  const pending = useMemo(() => getPendingRequests(overview), [overview]);
  const { acceptRequest: accept, rejectRequest: reject, cancelRequest: cancel } =
    actions;
  const { reload: reloadGroups, refresh: refreshGroups } = groupInvitations;

  const acceptRequest = useCallback(
    (requestId: string) => {
      void accept(requestId);
    },
    [accept],
  );

  const rejectRequest = useCallback(
    (requestId: string) => {
      void reject(requestId);
    },
    [reject],
  );

  const cancelRequest = useCallback(
    (requestId: string) => {
      void cancel(requestId);
    },
    [cancel],
  );

  const reloadAll = useCallback(() => {
    void reload();
    void reloadGroups();
  }, [reload, reloadGroups]);

  const refreshAll = useCallback(() => {
    void refresh();
    void refreshGroups();
  }, [refresh, refreshGroups]);

  return {
    loading,
    refreshing: refreshing || groupInvitations.refreshing,
    error,
    actionError: actions.error,
    pendingId: actions.pendingId,
    friendTotal: pending.total,
    groupTotal: groupInvitations.count,
    total: pending.total + groupInvitations.count,
    incoming: pending.incoming,
    outgoing: pending.outgoing,
    groupInvitations: groupInvitations.invitations,
    groupsLoading: groupInvitations.loading,
    groupError: groupInvitations.error,
    groupActionError: groupActions.error,
    groupPendingId: groupActions.pendingId,
    groupPendingAction: groupActions.pendingAction,
    reload: reloadAll,
    refresh: refreshAll,
    reloadGroups: () => {
      void reloadGroups();
    },
    acceptRequest,
    rejectRequest,
    cancelRequest,
    acceptInvitation: groupActions.accept,
    rejectInvitation: groupActions.reject,
  };
}
