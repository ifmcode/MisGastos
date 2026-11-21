import type {
  GroupJoinRequest,
  GroupJoinRequestStatus,
} from "../types/group-join.types";
import type { GroupWriteDeps } from "./group-deps";
import { GroupOperationError } from "./group.errors";
import { notifyGroupJoinRequest } from "./group-notify";
import { lookupGroupJoinCode } from "./group-join-lookup";

function assertJoinableStatus(status: GroupJoinRequestStatus | null): void {
  if (status === "pending") {
    throw new GroupOperationError("JOIN_REQUEST_ALREADY_PENDING");
  }
  if (status !== null) throw new GroupOperationError("JOIN_REQUEST_RESOLVED");
}

/**
 * Re-validates everything before writing: a member, a pending request and a
 * resolved (accepted/rejected/cancelled) one each get their own stable code, so
 * nothing is written for them. The owner notification is best-effort.
 */
export async function requestToJoinGroup(
  { repository, notifications }: GroupWriteDeps,
  viewerUid: string,
  rawCode: unknown,
): Promise<GroupJoinRequest> {
  const lookup = await lookupGroupJoinCode(repository, viewerUid, rawCode);
  if (lookup.membership === "member") {
    throw new GroupOperationError("ALREADY_MEMBER");
  }
  assertJoinableStatus(lookup.requestStatus);

  const request = await repository.createGroupJoinRequest({
    groupId: lookup.groupId,
    requesterId: viewerUid,
    joinCode: lookup.code,
    createdAt: new Date().toISOString(),
  });

  await notifyGroupJoinRequest(notifications, {
    requestId: request.id,
    groupId: lookup.groupId,
    groupName: lookup.groupName,
    requesterId: viewerUid,
    ownerId: lookup.ownerId,
    notifiedAt: request.createdAt,
  });

  return request;
}
