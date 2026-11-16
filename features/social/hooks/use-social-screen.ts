import { useCallback, useEffect, useMemo, useState } from "react";

import { useFriendsOverview } from "@/features/friends/hooks/use-friends-overview";
import type { Friend } from "@/features/friends/types/friend.types";
import { useAuth } from "@/hooks/use-auth";

import type { SocialSegment } from "../types/social.types";
import { countPendingRequests } from "../utils/pending-requests";
import { subscribeToRequestsRefresh } from "../utils/requests-refresh-store";

export interface SocialScreenController {
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  friends: Friend[];
  pendingCount: number;
  segment: SocialSegment;
  setSegment: (segment: SocialSegment) => void;
  menuVisible: boolean;
  openMenu: () => void;
  closeMenu: () => void;
  reload: () => void;
  refresh: () => void;
}

/** Composition root of the Social hub; owns the segment and the FAB menu. */
export function useSocialScreen(): SocialScreenController {
  const { user } = useAuth();
  const viewerUid = user?.uid;
  const { overview, loading, refreshing, error, reload, refresh } =
    useFriendsOverview({ viewerUid });
  const [segment, setSegment] = useState<SocialSegment>("friends");
  const [menuVisible, setMenuVisible] = useState(false);

  const pendingCount = useMemo(
    () => countPendingRequests(overview),
    [overview],
  );

  // The add-friend and requests routes live on top of this tab, so they ask
  // for a refresh through the store instead of waiting for the focus event.
  useEffect(
    () =>
      subscribeToRequestsRefresh(() => {
        void refresh();
      }),
    [refresh],
  );

  const openMenu = useCallback(() => setMenuVisible(true), []);
  const closeMenu = useCallback(() => setMenuVisible(false), []);

  return {
    loading,
    refreshing,
    error,
    friends: overview.friends,
    pendingCount,
    segment,
    setSegment,
    menuVisible,
    openMenu,
    closeMenu,
    reload: () => {
      void reload();
    },
    refresh: () => {
      void refresh();
    },
  };
}
