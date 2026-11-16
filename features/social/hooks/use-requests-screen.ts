import { useCallback, useMemo } from "react";

import { useFriendActions } from "@/features/friends/hooks/use-friend-actions";
import { useFriendsOverview } from "@/features/friends/hooks/use-friends-overview";
import type { FriendRequestItem } from "@/features/friends/types/friend.types";
import { useAuth } from "@/hooks/use-auth";

import { getPendingRequests } from "../utils/pending-requests";

export interface RequestsScreenController {
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  actionError: string | null;
  pendingId: string | null;
  total: number;
  incoming: FriendRequestItem[];
  outgoing: FriendRequestItem[];
  reload: () => void;
  refresh: () => void;
  acceptRequest: (requestId: string) => void;
  rejectRequest: (requestId: string) => void;
  cancelRequest: (requestId: string) => void;
}

/** Pending requests route: the overview filtered to `pending` plus actions. */
export function useRequestsScreen(): RequestsScreenController {
  const { user } = useAuth();
  const viewerUid = user?.uid;
  const { overview, loading, refreshing, error, reload, refresh } =
    useFriendsOverview({ viewerUid });
  const actions = useFriendActions({ viewerUid, onChanged: refresh });
  const pending = useMemo(() => getPendingRequests(overview), [overview]);
  const { acceptRequest: accept, rejectRequest: reject, cancelRequest: cancel } =
    actions;

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

  return {
    loading,
    refreshing,
    error,
    actionError: actions.error,
    pendingId: actions.pendingId,
    total: pending.total,
    incoming: pending.incoming,
    outgoing: pending.outgoing,
    reload: () => {
      void reload();
    },
    refresh: () => {
      void refresh();
    },
    acceptRequest,
    rejectRequest,
    cancelRequest,
  };
}
