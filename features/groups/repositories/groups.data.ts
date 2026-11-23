import type {
  Group,
  GroupInvitation,
  GroupMetadataUpdate,
} from "../types/group.types";
import type { GroupCode, GroupJoinRequest } from "../types/group-join.types";

export const GROUPS_COLLECTION = "groups";
export const GROUP_INVITATIONS_COLLECTION = "groupInvitations";
export const GROUP_CODES_COLLECTION = "groupCodes";
export const GROUP_JOIN_REQUESTS_COLLECTION = "groupJoinRequests";

export function toGroupData(group: Group): Record<string, unknown> {
  return {
    ownerId: group.ownerId,
    memberIds: group.memberIds,
    name: group.name,
    description: group.description,
    defaultCurrency: group.defaultCurrency,
    joinCode: group.joinCode,
    simplifyDebts: group.simplifyDebts,
    createdAt: group.createdAt,
    updatedAt: group.updatedAt,
  };
}

/** Mutable slice of a group: membership and stamps are never sent here. */
export function toGroupUpdateData(
  update: GroupMetadataUpdate,
): Record<string, unknown> {
  return {
    name: update.name,
    description: update.description,
    defaultCurrency: update.defaultCurrency,
    simplifyDebts: update.simplifyDebts,
    updatedAt: update.updatedAt,
  };
}

export function toGroupInvitationData(
  invitation: GroupInvitation,
): Record<string, unknown> {
  return {
    groupId: invitation.groupId,
    groupName: invitation.groupName,
    inviterId: invitation.inviterId,
    inviteeId: invitation.inviteeId,
    pairId: invitation.pairId,
    status: invitation.status,
    createdAt: invitation.createdAt,
    updatedAt: invitation.updatedAt,
  };
}

/**
 * Re-open a rejected/cancelled (or accepted-then-removed) invitation. The rules
 * only allow `status` + `updatedAt` in that transition, so the group name is
 * refreshed by its own pending -> pending write when it drifted.
 */
export function toGroupInvitationReopenData(
  updatedAt: string,
): Record<string, unknown> {
  return { status: "pending", updatedAt };
}

/** Pending -> pending rename propagation allowed by the rules. */
export function toGroupInvitationRenameData(
  groupName: string,
  updatedAt: string,
): Record<string, unknown> {
  return { groupName, updatedAt };
}

/** `groupCodes/{code}` projection; the code lives in the document id. */
export function toGroupCodeData(code: GroupCode): Record<string, unknown> {
  return {
    groupId: code.groupId,
    ownerId: code.ownerId,
    groupName: code.groupName,
  };
}

/** Rename propagation of the code projection; only `groupName` may change. */
export function toGroupCodeRenameData(
  groupName: string,
): Record<string, unknown> {
  return { groupName };
}

export function toGroupJoinRequestData(
  request: GroupJoinRequest,
): Record<string, unknown> {
  return {
    groupId: request.groupId,
    requesterId: request.requesterId,
    joinCode: request.joinCode,
    status: request.status,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
  };
}
