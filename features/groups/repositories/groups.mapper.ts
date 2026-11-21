import { createFriendPairId } from "@/features/friends/utils/friend-pair";
import { isCurrencyCode } from "@/shared/constants/currencies";

import {
  GROUP_DESCRIPTION_MAX_LENGTH,
  GROUP_INVITATION_STATUSES,
  GROUP_MAX_MEMBERS,
  GROUP_NAME_MAX_LENGTH,
  type Group,
  type GroupInvitation,
  type GroupInvitationStatus,
} from "../types/group.types";
import { createGroupInvitationId, groupIdBelongsToOwner } from "../utils/group-ids";
import { normalizeGroupJoinCode } from "../utils/group-join-code";

export {
  mapGroupCodeDocument,
  mapGroupJoinRequestDocument,
} from "./group-join.mapper";

function readText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function readStringList(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;

  const items: unknown[] = value;
  const list = items.map((item) => readText(item));

  return list.every((item) => item.length > 0) ? list : null;
}

function readDescription(value: unknown): string | null | undefined {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") return undefined;

  const description = value.trim();
  if (description.length > GROUP_DESCRIPTION_MAX_LENGTH) return undefined;

  return description.length > 0 ? description : null;
}

function readStatus(value: unknown): GroupInvitationStatus | null {
  return GROUP_INVITATION_STATUSES.includes(value as GroupInvitationStatus)
    ? (value as GroupInvitationStatus)
    : null;
}

/**
 * Absent/null is a legacy group (no code yet); a present but malformed code
 * maps to null instead of dropping the whole group.
 */
function readJoinCode(value: unknown): string | null {
  if (value === null || value === undefined) return null;

  return normalizeGroupJoinCode(value) || null;
}

/**
 * Converts a `groups` document. The id must be owner-namespaced
 * (`ownerId__autoId`) and the membership order is part of the contract, so an
 * owner that is not first, a duplicated uid, an oversized list, a bad currency,
 * a missing stamp or a foreign id drops the whole record instead of showing a
 * group the rules would not accept.
 */
export function mapGroupDocument(
  id: string,
  data: Record<string, unknown>,
): Group | null {
  const groupId = readText(id);
  const ownerId = readText(data.ownerId);
  const memberIds = readStringList(data.memberIds);
  const name = readText(data.name);
  const description = readDescription(data.description);
  const currency = data.defaultCurrency;
  const createdAt = readText(data.createdAt);
  const updatedAt = readText(data.updatedAt);
  const joinCode = readJoinCode(data.joinCode);

  if (groupId.length === 0 || ownerId.length === 0) return null;
  if (!groupIdBelongsToOwner(groupId, ownerId)) return null;
  if (description === undefined) return null;
  if (!isCurrencyCode(currency)) return null;
  if (createdAt.length === 0 || updatedAt.length === 0) return null;
  if (name.length === 0 || name.length > GROUP_NAME_MAX_LENGTH) return null;
  if (!memberIds) return null;
  if (memberIds[0] !== ownerId) return null;
  if (memberIds.length > GROUP_MAX_MEMBERS) return null;
  if (new Set(memberIds).size !== memberIds.length) return null;

  return {
    id: groupId,
    ownerId,
    memberIds,
    name,
    description,
    defaultCurrency: currency,
    joinCode,
    createdAt,
    updatedAt,
  };
}

/**
 * Converts a `groupInvitations` document. The id and the pair are rebuilt from
 * the stored ids, so a forged or stale value can never open an invitation the
 * rules would not accept; a group id outside the inviter's namespace is a
 * forged invitation and is dropped too.
 */
export function mapGroupInvitationDocument(
  id: string,
  data: Record<string, unknown>,
): GroupInvitation | null {
  const invitationId = readText(id);
  const groupId = readText(data.groupId);
  const groupName = readText(data.groupName);
  const inviterId = readText(data.inviterId);
  const inviteeId = readText(data.inviteeId);
  const pairId = readText(data.pairId);
  const status = readStatus(data.status);
  const createdAt = readText(data.createdAt);
  const updatedAt = readText(data.updatedAt);

  if (invitationId.length === 0) return null;
  if (groupId.length === 0 || inviterId.length === 0) return null;
  if (inviteeId.length === 0 || status === null) return null;
  if (createdAt.length === 0 || updatedAt.length === 0) return null;
  if (groupName.length === 0 || groupName.length > GROUP_NAME_MAX_LENGTH) {
    return null;
  }
  if (!groupIdBelongsToOwner(groupId, inviterId)) return null;
  if (createGroupInvitationId(groupId, inviteeId) !== invitationId) return null;
  if (createFriendPairId(inviterId, inviteeId) !== pairId) return null;
  if (pairId.length === 0) return null;

  return {
    id: invitationId,
    groupId,
    groupName,
    inviterId,
    inviteeId,
    pairId,
    status,
    createdAt,
    updatedAt,
  };
}
