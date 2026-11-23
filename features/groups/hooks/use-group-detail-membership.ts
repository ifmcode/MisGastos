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
  /** Reloads the detail after a member or code change. */
  onChanged: () => void;
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
  onChanged,
}: UseGroupDetailMembershipOptions): GroupDetailMembershipController {
  const memberActions = useGroupMemberActions({
    viewerUid,
    groupId,
    onChanged,
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
