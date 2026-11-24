import type { GroupBalances } from "@/features/group-expenses/types/group-balance.types";

import type { GroupDetail } from "../types/group.types";
import {
  useGroupJoinCode,
  type GroupJoinCodeController,
} from "./use-group-join-code";
import {
  useGroupMemberActions,
  type GroupMemberActionsController,
} from "./use-group-member-actions";

export interface UseGroupDetailMembershipOptions {
  viewerUid: string | undefined;
  groupId: string;
  detail: GroupDetail | null;
  /** Already-loaded nets: the remove/leave pre-check never reads again. */
  balances: GroupBalances | null;
  /** Reloads the detail after a member or code change. */
  onChanged: () => void;
  /** Leaves the route once the viewer left the group. */
  onLeft?: () => void;
  /** Opens the settle route from the blocked-balance dialog. */
  onOpenSettle?: () => void;
}

export interface GroupDetailMembershipController {
  memberActions: GroupMemberActionsController;
  joinCode: GroupJoinCodeController;
}

/**
 * Membership actions and join code of one group detail. The owner join-request
 * queue lives in Social since TICKET-070.
 */
export function useGroupDetailMembership({
  viewerUid,
  groupId,
  detail,
  balances,
  onChanged,
  onLeft,
  onOpenSettle,
}: UseGroupDetailMembershipOptions): GroupDetailMembershipController {
  const isOwner = detail ? detail.group.ownerId === viewerUid : false;

  const memberActions = useGroupMemberActions({
    viewerUid,
    groupId,
    groupName: detail?.group.name ?? "",
    isOwner,
    balances,
    onChanged,
    onLeft,
    onOpenSettle,
  });

  const joinCode = useGroupJoinCode({
    viewerUid,
    groupId,
    groupName: detail?.group.name ?? "",
    joinCode: detail?.group.joinCode ?? null,
    onGenerated: onChanged,
  });

  return { memberActions, joinCode };
}
