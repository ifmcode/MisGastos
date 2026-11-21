import type { IGroupsRepository } from "../repositories/groups.repository";
import type { Group } from "../types/group.types";
import type { GroupJoinRequest } from "../types/group-join.types";
import { generateGroupJoinCode } from "../utils/group-join-code";
import type { GroupWriteDeps } from "./group-deps";
import { GroupOperationError, getGroupErrorCode } from "./group.errors";
import { assertGroupOwner, requireGroup } from "./group-guards";
import { notifyGroupJoinOutcome } from "./group-notify";

/**
 * Owner-only decision. The group is readable because the owner is a member;
 * the transaction re-checks ownership, the pending status and the 20 cap. The
 * requester notification is best-effort and carries the current group name.
 */
export async function respondToGroupJoinRequest(
  { repository, notifications }: GroupWriteDeps,
  viewerUid: string,
  groupId: string,
  requestId: string,
  decision: "accepted" | "rejected",
): Promise<{ group: Group; request: GroupJoinRequest }> {
  const group = await requireGroup(repository, groupId);
  assertGroupOwner(group, viewerUid);

  const request = await repository.getGroupJoinRequest(requestId);
  if (!request || request.groupId !== group.id) {
    throw new GroupOperationError("JOIN_REQUEST_NOT_FOUND");
  }

  const updatedAt = new Date().toISOString();
  const result = await repository.respondToGroupJoinRequest({
    requestId: request.id,
    groupId: group.id,
    viewerUid,
    decision,
    updatedAt,
  });

  await notifyGroupJoinOutcome(notifications, {
    requestId: result.request.id,
    groupId: group.id,
    groupName: group.name,
    requesterId: request.requesterId,
    ownerId: viewerUid,
    decision,
    notifiedAt: updatedAt,
  });

  return result;
}

/**
 * Lazy code for a legacy group. An existing code is returned untouched. A
 * denied write means another client won the create (reuse its code) or the
 * generated code was taken; the reload decides, and a still-missing code is
 * retried with a fresh value up to a small bound.
 */
const MAX_JOIN_CODE_ATTEMPTS = 3;

export async function ensureGroupJoinCode(
  repository: IGroupsRepository,
  viewerUid: string,
  groupId: string,
): Promise<string> {
  const group = await requireGroup(repository, groupId);
  assertGroupOwner(group, viewerUid);
  if (group.joinCode) return group.joinCode;

  for (let attempt = 0; attempt < MAX_JOIN_CODE_ATTEMPTS; attempt += 1) {
    const code = generateGroupJoinCode();

    try {
      const updated = await repository.ensureGroupJoinCode({
        groupId: group.id,
        code,
        updatedAt: new Date().toISOString(),
      });

      return updated.joinCode ?? code;
    } catch (error) {
      if (getGroupErrorCode(error) !== "PERMISSION_DENIED") throw error;

      const reloaded = await repository.getGroup(group.id);
      if (reloaded?.joinCode) return reloaded.joinCode;
    }
  }

  throw new GroupOperationError("JOIN_CODE_NOT_AVAILABLE");
}
