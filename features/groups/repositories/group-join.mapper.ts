import { GROUP_NAME_MAX_LENGTH } from "../types/group.types";
import {
  GROUP_JOIN_REQUEST_STATUSES,
  type GroupCode,
  type GroupJoinRequest,
  type GroupJoinRequestStatus,
} from "../types/group-join.types";
import {
  createGroupJoinRequestId,
  isGroupJoinCode,
  isGroupJoinRequestId,
  normalizeGroupJoinCode,
} from "../utils/group-join-code";

function readText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function readStatus(value: unknown): GroupJoinRequestStatus | null {
  return GROUP_JOIN_REQUEST_STATUSES.includes(value as GroupJoinRequestStatus)
    ? (value as GroupJoinRequestStatus)
    : null;
}

function isGroupName(value: string): boolean {
  return value.length > 0 && value.length <= GROUP_NAME_MAX_LENGTH;
}

/**
 * `groupCodes/{code}` projection. The id must be a valid code and the group,
 * owner and name must be present, so a forged lookup row cannot point a code to
 * an unrelated group.
 */
export function mapGroupCodeDocument(
  id: string,
  data: Record<string, unknown>,
): GroupCode | null {
  const code = isGroupJoinCode(id.trim()) ? id.trim() : "";
  const groupId = readText(data.groupId);
  const ownerId = readText(data.ownerId);
  const groupName = readText(data.groupName);

  if (code.length === 0) return null;
  if (groupId.length === 0 || ownerId.length === 0) return null;
  if (!isGroupName(groupName)) return null;

  return { code, groupId, ownerId, groupName };
}

/**
 * `groupJoinRequests/{groupId}__{requesterId}` document. The id is rebuilt from
 * the stored ids, so a forged or stale row is dropped; the same check also
 * guarantees one request per group and requester.
 */
export function mapGroupJoinRequestDocument(
  id: string,
  data: Record<string, unknown>,
): GroupJoinRequest | null {
  const requestId = readText(id);
  const groupId = readText(data.groupId);
  const requesterId = readText(data.requesterId);
  const joinCode = normalizeGroupJoinCode(data.joinCode);
  const status = readStatus(data.status);
  const createdAt = readText(data.createdAt);
  const updatedAt = readText(data.updatedAt);

  if (!isGroupJoinRequestId(requestId)) return null;
  if (groupId.length === 0 || requesterId.length === 0) return null;
  if (createGroupJoinRequestId(groupId, requesterId) !== requestId) return null;
  if (joinCode.length === 0 || status === null) return null;
  if (createdAt.length === 0 || updatedAt.length === 0) return null;

  return {
    id: requestId,
    groupId,
    requesterId,
    joinCode,
    status,
    createdAt,
    updatedAt,
  };
}
