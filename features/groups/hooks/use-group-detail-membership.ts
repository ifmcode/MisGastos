import type { GroupDetail } from "../types/group.types";
import {
  useGroupJoinCode,
  type GroupJoinCodeController,
} from "./use-group-join-code";
import {
  useGroupJoinRequests,
  type GroupJoinRequestsController,
} from "./use-group-join-requests";
import {
  useGroupMemberActions,
  type GroupMemberActionsController,
} from "./use-group-member-actions";

export interface UseGroupDetailMembershipOptions {
  viewerUid: string | undefined;
  groupId: string;
  detail: GroupDetail | null;
  /** Reloads the detail after a member, code or request change. */
  onChanged: () => void;
}

export interface GroupDetailMembershipController {
  memberActions: GroupMemberActionsController;
  joinCode: GroupJoinCodeController;
  joinRequests: GroupJoinRequestsController;
}

/** Membership actions, join code and owner queue of one group detail. */
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

  const joinRequests = useGroupJoinRequests({
    viewerUid,
    groupId,
    requests: detail?.joinRequests ?? [],
    onChanged,
  });

  return { memberActions, joinCode, joinRequests };
}
