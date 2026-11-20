import type { IGroupsRepository } from "../repositories/groups.repository";
import type { Group, GroupInvitation } from "../types/group.types";
import { getGroupInviteCapacity } from "../utils/group-invite-eligibility";
import { isGroupMember } from "../utils/group-membership";
import { GroupOperationError } from "./group.errors";

/** Every use case requires the signed-in uid; a blank one is not a session. */
export function requireGroupViewer(viewerUid: unknown): string {
  const viewer = typeof viewerUid === "string" ? viewerUid.trim() : "";

  if (viewer.length === 0) {
    throw new GroupOperationError("SIGN_IN_REQUIRED");
  }

  return viewer;
}

/** Loads the group or fails with a stable code, never with a sentence. */
export async function requireGroup(
  repository: IGroupsRepository,
  groupId: string,
): Promise<Group> {
  const id = typeof groupId === "string" ? groupId.trim() : "";
  const group = id.length > 0 ? await repository.getGroup(id) : null;

  if (!group) throw new GroupOperationError("GROUP_NOT_FOUND");

  return group;
}

export function assertGroupMember(group: Group, viewerUid: string): void {
  if (!isGroupMember(group.memberIds, viewerUid)) {
    throw new GroupOperationError("NOT_GROUP_MEMBER");
  }
}

export function assertGroupOwner(group: Group, viewerUid: string): void {
  if (group.ownerId !== viewerUid) {
    throw new GroupOperationError("NOT_GROUP_OWNER");
  }
}

/**
 * A pending invitation already reserves a seat, so the caller must pass how many
 * the group has. Otherwise the owner could queue 20 invitations and the late
 * acceptances would fail with GROUP_FULL.
 */
export function assertGroupNotFull(
  group: Group,
  pendingCount = 0,
): void {
  if (getGroupInviteCapacity(group.memberIds, pendingCount) <= 0) {
    throw new GroupOperationError("GROUP_FULL");
  }
}

export async function requireGroupInvitation(
  repository: IGroupsRepository,
  invitationId: string,
): Promise<GroupInvitation> {
  const id = typeof invitationId === "string" ? invitationId.trim() : "";
  const invitation = id.length > 0
    ? await repository.getGroupInvitation(id)
    : null;

  if (!invitation) {
    throw new GroupOperationError("INVITATION_NOT_FOUND");
  }

  return invitation;
}

export function assertInvitationInvitee(
  invitation: GroupInvitation,
  viewerUid: string,
): void {
  if (invitation.inviteeId !== viewerUid) {
    throw new GroupOperationError("NOT_INVITEE");
  }
}

export function assertInvitationPending(invitation: GroupInvitation): void {
  if (invitation.status !== "pending") {
    throw new GroupOperationError("INVITATION_NOT_PENDING");
  }
}
