import { useCallback, useMemo } from "react";

import { useFriendActions } from "@/features/friends/hooks/use-friend-actions";
import { useFriendsOverview } from "@/features/friends/hooks/use-friends-overview";
import type { FriendRequestItem } from "@/features/friends/types/friend.types";
import {
  useGroupInvitationActions,
  type GroupInvitationResponse,
} from "@/features/groups/hooks/use-group-invitation-actions";
import { useGroupInvitations } from "@/features/groups/hooks/use-group-invitations";
import {
  useOwnerJoinRequests,
  type OwnerJoinRequestsController,
} from "@/features/groups/hooks/use-owner-join-requests";
import type { PendingGroupInvitationItem } from "@/features/groups/types/group.types";
import { useAuth } from "@/hooks/use-auth";

import { getPendingRequests } from "../utils/pending-requests";

export interface RequestsScreenController {
  loading: boolean;
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
  ownerJoinRequests: OwnerJoinRequestsController;
  reload: () => void;
  reloadGroups: () => void;
  acceptRequest: (requestId: string) => void;
  rejectRequest: (requestId: string) => void;
  cancelRequest: (requestId: string) => void;
  acceptInvitation: (invitationId: string) => void;
  rejectInvitation: (invitationId: string) => void;
}

/**
 * `social/requests`: the owner join-request queue, received group invitations
 * and friend requests. Each source keeps its own loading and error state.
 */
export function useRequestsScreen(): RequestsScreenController {
  const { user } = useAuth();
  const viewerUid = user?.uid;
  const { overview, loading, error, reload, refresh } =
    useFriendsOverview({ viewerUid });
  const actions = useFriendActions({ viewerUid, onChanged: refresh });
  const groupInvitations = useGroupInvitations({ viewerUid });
  const { removeInvitation } = groupInvitations;
  const groupActions = useGroupInvitationActions({
    viewerUid,
    onResponded: removeInvitation,
  });
  const { reload: reloadGroups } = groupInvitations;
  const ownerJoinRequests = useOwnerJoinRequests({ viewerUid });
  const pending = useMemo(
    () => getPendingRequests(overview, ownerJoinRequests.count),
    [overview, ownerJoinRequests.count],
  );
  const { acceptRequest: accept, rejectRequest: reject, cancelRequest: cancel } =
    actions;
  const { reload: reloadOwnerQueue } = ownerJoinRequests;

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
    void reloadOwnerQueue();
  }, [reload, reloadGroups, reloadOwnerQueue]);

  return {
    loading: loading || ownerJoinRequests.loading,
    error,
    actionError: actions.error,
    pendingId: actions.pendingId,
    friendTotal: pending.incoming.length + pending.outgoing.length,
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
    ownerJoinRequests,
    reload: reloadAll,
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
