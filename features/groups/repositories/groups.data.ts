import type {
  Group,
  GroupInvitation,
  GroupMetadataUpdate,
} from "../types/group.types";

export const GROUPS_COLLECTION = "groups";
export const GROUP_INVITATIONS_COLLECTION = "groupInvitations";

export function toGroupData(group: Group): Record<string, unknown> {
  return {
    ownerId: group.ownerId,
    memberIds: group.memberIds,
    name: group.name,
    description: group.description,
    defaultCurrency: group.defaultCurrency,
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
