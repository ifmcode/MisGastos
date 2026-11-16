import { useCallback, useEffect, useMemo, useState } from "react";

import { useFriendActions } from "@/features/friends/hooks/use-friend-actions";
import { useFriendsOverview } from "@/features/friends/hooks/use-friends-overview";
import type { Friend } from "@/features/friends/types/friend.types";
import { getFriendDisplayName } from "@/features/friends/utils/friend-display";
import { useAuth } from "@/hooks/use-auth";
import {
  useConfirmDialog,
  type UseConfirmDialogResult,
} from "@/shared/hooks/use-confirm-dialog";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import type { SocialSegment } from "../types/social.types";
import { countPendingRequests } from "../utils/pending-requests";
import { subscribeToRequestsRefresh } from "../utils/requests-refresh-store";

export interface SocialScreenController {
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  friends: Friend[];
  pendingCount: number;
  actionError: string | null;
  pendingId: string | null;
  segment: SocialSegment;
  setSegment: (segment: SocialSegment) => void;
  menuVisible: boolean;
  openMenu: () => void;
  closeMenu: () => void;
  confirm: UseConfirmDialogResult;
  reload: () => void;
  refresh: () => void;
  requestRemove: (friend: Friend) => void;
}

/** Composition root of the Social hub; owns the segment, the FAB and removal. */
export function useSocialScreen(): SocialScreenController {
  const { user } = useAuth();
  const viewerUid = user?.uid;
  const { t } = useScopedTranslation("friends");
  const { overview, loading, refreshing, error, reload, refresh } =
    useFriendsOverview({ viewerUid });
  const actions = useFriendActions({ viewerUid, onChanged: refresh });
  const confirm = useConfirmDialog();
  const [segment, setSegment] = useState<SocialSegment>("friends");
  const [menuVisible, setMenuVisible] = useState(false);

  const { open: openConfirm } = confirm;
  const { removeFriend } = actions;
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

  const requestRemove = useCallback(
    (friend: Friend) => {
      openConfirm({
        title: t("removeDialog.title"),
        message: t("removeDialog.message", {
          name: getFriendDisplayName(friend),
        }),
        confirmLabel: t("removeDialog.confirm"),
        cancelLabel: t("removeDialog.cancel"),
        onConfirm: () => {
          void removeFriend(friend.uid);
        },
      });
    },
    [openConfirm, removeFriend, t],
  );

  const openMenu = useCallback(() => setMenuVisible(true), []);
  const closeMenu = useCallback(() => setMenuVisible(false), []);

  return {
    loading,
    refreshing,
    error,
    friends: overview.friends,
    pendingCount,
    actionError: actions.error,
    pendingId: actions.pendingId,
    segment,
    setSegment,
    menuVisible,
    openMenu,
    closeMenu,
    confirm,
    reload: () => {
      void reload();
    },
    refresh: () => {
      void refresh();
    },
    requestRemove,
  };
}
