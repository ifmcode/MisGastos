import type { IGroupsRepository } from "../repositories/groups.repository";
import type { GroupJoinLookup } from "../types/group-join.types";
import {
  createGroupJoinRequestId,
  normalizeGroupJoinCode,
} from "../utils/group-join-code";
import { GroupOperationError } from "./group.errors";

/**
 * Resolves a code through the projection and returns only ids and names. It
 * never reads the group document, so a non-member cannot learn its members.
 */
export async function lookupGroupJoinCode(
  repository: IGroupsRepository,
  viewerUid: string,
  rawCode: unknown,
): Promise<GroupJoinLookup> {
  const code = normalizeGroupJoinCode(rawCode);
  if (code.length === 0) throw new GroupOperationError("INVALID_JOIN_CODE");

  const projection = await repository.getGroupCode(code);
  if (!projection) throw new GroupOperationError("INVALID_JOIN_CODE");

  const groups = await repository.getGroups(viewerUid);
  const membership = groups.some((group) => group.id === projection.groupId)
    ? "member"
    : "none";
  const request = await repository.getGroupJoinRequest(
    createGroupJoinRequestId(projection.groupId, viewerUid),
  );

  return {
    code: projection.code,
    groupId: projection.groupId,
    ownerId: projection.ownerId,
    groupName: projection.groupName,
    membership,
    requestStatus: request?.status ?? null,
  };
}
