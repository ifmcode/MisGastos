import { useCallback, useEffect, useMemo, useState } from "react";

import { useFriendsOverview } from "@/features/friends/hooks/use-friends-overview";
import type { Friend } from "@/features/friends/types/friend.types";
import {
  useGroupEditor,
  type GroupEditorController,
} from "@/features/groups/hooks/use-group-editor";
import { useProfile } from "@/features/profile/hooks/use-profile";
import { useAuth } from "@/hooks/use-auth";
import { DEFAULT_CURRENCY } from "@/shared/constants/currencies";

import type { SocialSegment } from "../types/social.types";
import { countPendingRequests } from "../utils/pending-requests";
import { subscribeToRequestsRefresh } from "../utils/requests-refresh-store";
import {
  useSocialGroups,
  type SocialGroupsController,
} from "./use-social-groups";

export interface SocialScreenController {
  viewerUid: string;
  loading: boolean;
  error: string | null;
  friends: Friend[];
  friendsLoading: boolean;
  pendingCount: number;
  segment: SocialSegment;
  setSegment: (segment: SocialSegment) => void;
  menuVisible: boolean;
  openMenu: () => void;
  closeMenu: () => void;
  groups: SocialGroupsController;
  editor: GroupEditorController;
  reload: () => void;
}

/** Composition root of the Social hub; owns the segment and the FAB menu. */
export function useSocialScreen(): SocialScreenController {
  const { user } = useAuth();
  const viewerUid = user?.uid;
  const { profile } = useProfile();
  const {
    overview,
    loading,
    error,
    reload,
    refresh,
  } = useFriendsOverview({ viewerUid });
  const groups = useSocialGroups({ viewerUid });
  const { reload: reloadGroups, refresh: refreshGroups } = groups;
  const [segment, setSegment] = useState<SocialSegment>("friends");
  const [menuVisible, setMenuVisible] = useState(false);

  // A new group only shows up in the groups segment, so reveal it on save.
  const handleGroupSaved = useCallback(() => {
    reloadGroups();
    setSegment("groups");
  }, [reloadGroups]);

  const editor = useGroupEditor({
    viewerUid,
    preferredCurrency: profile?.preferredCurrency ?? DEFAULT_CURRENCY,
    onSaved: handleGroupSaved,
  });

  const pendingCount = useMemo(
    () =>
      countPendingRequests(overview, groups.joinRequestsCount) +
      groups.invitationsCount,
    [overview, groups.invitationsCount, groups.joinRequestsCount],
  );

  // Friends, groups and received invitations reload together after the
  // requests routes report a change.
  const refreshAll = useCallback(() => {
    void refresh();
    refreshGroups();
  }, [refresh, refreshGroups]);

  const reloadAll = useCallback(() => {
    void reload();
    reloadGroups();
  }, [reload, reloadGroups]);

  // The add-friend and requests routes live on top of this tab, so they ask
  // for a refresh through the store instead of waiting for the focus event.
  useEffect(
    () =>
      subscribeToRequestsRefresh(() => {
        refreshAll();
      }),
    [refreshAll],
  );

  const openMenu = useCallback(() => setMenuVisible(true), []);
  const closeMenu = useCallback(() => setMenuVisible(false), []);

  return {
    viewerUid: viewerUid ?? "",
    loading,
    error,
    friends: overview.friends,
    friendsLoading: loading,
    pendingCount,
    segment,
    setSegment,
    menuVisible,
    openMenu,
    closeMenu,
    groups,
    editor,
    reload: reloadAll,
  };
}
