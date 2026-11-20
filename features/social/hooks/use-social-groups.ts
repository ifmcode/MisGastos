import { useCallback, useMemo } from "react";

import { useGroupInvitations } from "@/features/groups/hooks/use-group-invitations";
import { useGroups } from "@/features/groups/hooks/use-groups";
import type { Group } from "@/features/groups/types/group.types";

export interface UseSocialGroupsOptions {
  viewerUid: string | undefined;
}

export interface SocialGroupsController {
  groups: Group[];
  invitationsCount: number;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  reload: () => void;
  refresh: () => void;
}

/**
 * Groups and received invitations of the Social tab. Both live in the groups
 * feature; this hook only composes them so the segment and the pull-to-refresh
 * stay independent from the friends source.
 */
export function useSocialGroups({
  viewerUid,
}: UseSocialGroupsOptions): SocialGroupsController {
  const groups = useGroups({ viewerUid });
  const invitations = useGroupInvitations({ viewerUid });
  const { reload: reloadGroups, refresh: refreshGroups } = groups;
  const {
    reload: reloadInvitations,
    refresh: refreshInvitations,
  } = invitations;

  const reload = useCallback(() => {
    void reloadGroups();
    void reloadInvitations();
  }, [reloadGroups, reloadInvitations]);

  const refresh = useCallback(() => {
    void refreshGroups();
    void refreshInvitations();
  }, [refreshGroups, refreshInvitations]);

  return useMemo(
    () => ({
      groups: groups.groups,
      invitationsCount: invitations.count,
      loading: groups.loading,
      refreshing: groups.refreshing || invitations.refreshing,
      error: groups.error ?? invitations.error,
      reload,
      refresh,
    }),
    [
      groups.groups,
      groups.loading,
      groups.refreshing,
      groups.error,
      invitations.count,
      invitations.refreshing,
      invitations.error,
      reload,
      refresh,
    ],
  );
}
