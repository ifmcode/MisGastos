import { createFriendPairId } from "@/features/friends/utils/friend-pair";
import { isCurrencyCode } from "@/shared/constants/currencies";

import {
  GROUP_MAX_MEMBERS,
  GROUP_NAME_MAX_LENGTH,
  type Group,
  type GroupInvitation,
} from "../types/group.types";
import { createGroupInvitationId, groupIdBelongsToOwner } from "../utils/group-ids";
import {
  readDescription,
  readJoinCode,
  readSimplifyDebts,
  readStatus,
  readStringList,
  readText,
} from "./groups.mapper.readers";

export {
  mapGroupCodeDocument,
  mapGroupJoinRequestDocument,
} from "./group-join.mapper";

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
  const storedCreatedBy = data.createdBy;
  const createdBy =
    storedCreatedBy === null || storedCreatedBy === undefined
      ? ownerId
      : readText(storedCreatedBy);
  const memberIds = readStringList(data.memberIds);
  const name = readText(data.name);
  const description = readDescription(data.description);
  const currency = data.defaultCurrency;
  const createdAt = readText(data.createdAt);
  const updatedAt = readText(data.updatedAt);
  const joinCode = readJoinCode(data.joinCode);
  const simplifyDebts = readSimplifyDebts(data.simplifyDebts);

  if (groupId.length === 0 || ownerId.length === 0) return null;
  // The id prefix always belongs to the immutable creator, never to a promoted
  // owner; a missing `createdBy` is a pre-TICKET-068 group and falls back.
  if (createdBy.length === 0) return null;
  if (!groupIdBelongsToOwner(groupId, createdBy)) return null;
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
    createdBy,
    memberIds,
    name,
    description,
    defaultCurrency: currency,
    joinCode,
    simplifyDebts,
    createdAt,
    updatedAt,
  };
}

/**
 * Converts a `groupInvitations` document. The id, the pair and the status are
 * rebuilt from the stored ids, so a forged or stale value can never open an
 * invitation the rules would not accept.
 *
 * The id prefix is deliberately NOT checked against `inviterId`: the prefix
 * belongs to the immutable `createdBy`, while `inviterId` is the current owner
 * who (re)opened the invitation. After a transfer the two legitimately differ,
 * and the rules already prove who may create or reopen the document.
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
