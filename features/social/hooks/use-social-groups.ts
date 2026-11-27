import { useCallback, useMemo } from "react";

import { useGroupBalanceSummaries } from "@/features/group-expenses/hooks/use-group-balance-summaries";
import type { ViewerGroupBalance } from "@/features/group-expenses/types/group-balance.types";
import { useGroupInvitations } from "@/features/groups/hooks/use-group-invitations";
import { useOwnerJoinRequests } from "@/features/groups/hooks/use-owner-join-requests";
import { useGroups } from "@/features/groups/hooks/use-groups";
import type { Group } from "@/features/groups/types/group.types";

export interface UseSocialGroupsOptions {
  viewerUid: string | undefined;
}

export interface SocialGroupsController {
  groups: Group[];
  /** Viewer nets by group id; the map stays empty while they load or fail. */
  balanceSummaries: Map<string, ViewerGroupBalance[]>;
  invitationsCount: number;
  /** Pending join requests of the groups the viewer owns. */
  joinRequestsCount: number;
  loading: boolean;
  error: string | null;
  reload: () => void;
  refresh: () => void;
}

/**
 * Groups, their viewer balances, received invitations and the owner join-request
 * queue of the Social tab. All live in the groups feature; this hook only
 * composes them so the segment and the background refresh stay independent from
 * the friends source.
 */
export function useSocialGroups({
  viewerUid,
}: UseSocialGroupsOptions): SocialGroupsController {
  const groups = useGroups({ viewerUid });
  const balances = useGroupBalanceSummaries({ viewerUid });
  const invitations = useGroupInvitations({ viewerUid });
  const { reload: reloadGroups, refresh: refreshGroups } = groups;
  const { reload: reloadBalances, refresh: refreshBalances } = balances;
  const { reload: reloadInvitations, refresh: refreshInvitations } =
    invitations;
  const joinRequests = useOwnerJoinRequests({
    viewerUid,
    onResponded: refreshGroups,
  });
  const { reload: reloadJoinRequests, refresh: refreshJoinRequests } =
    joinRequests;

  const reload = useCallback(() => {
    void reloadGroups();
    void reloadBalances();
    void reloadInvitations();
    void reloadJoinRequests();
  }, [reloadBalances, reloadGroups, reloadInvitations, reloadJoinRequests]);

  const refresh = useCallback(() => {
    void refreshGroups();
    void refreshBalances();
    void refreshInvitations();
    void refreshJoinRequests();
  }, [
    refreshBalances,
    refreshGroups,
    refreshInvitations,
    refreshJoinRequests,
  ]);

  return useMemo(
    () => ({
      groups: groups.groups,
      balanceSummaries: balances.summaries,
      invitationsCount: invitations.count,
      joinRequestsCount: joinRequests.count,
      // The list never waits for the summaries: an empty map renders "En paz".
      loading: groups.loading || joinRequests.loading,
      error: groups.error ?? balances.error ?? invitations.error ?? joinRequests.error,
      reload,
      refresh,
    }),
    [
      groups.groups,
      groups.loading,
      groups.error,
      balances.summaries,
      balances.error,
      invitations.count,
      invitations.error,
      joinRequests.count,
      joinRequests.loading,
      joinRequests.error,
      reload,
      refresh,
    ],
  );
}
