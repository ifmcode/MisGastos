import type {
  Group,
  GroupInvitation,
  GroupUpdateInput,
} from "../types/group.types";
import { filterPendingInvitations } from "../utils/group-list";
import type { GroupWriteDeps } from "./group-deps";
import { GroupOperationError } from "./group.errors";
import {
  assertGroupNotFull,
  assertGroupOwner,
  assertInvitationInvitee,
  assertInvitationPending,
  requireGroup,
  requireGroupInvitation,
} from "./group-guards";
import { assertFriendshipExists } from "./group-friendship";
import { inviteMembersToGroup } from "./group-invite";
import {
  validateGroupUpdateOrThrow,
  validateInviteesOrThrow,
} from "./group-validation";

export async function updateGroupRecord(
  repository: GroupWriteDeps["repository"],
  viewerUid: string,
  groupId: string,
  input: GroupUpdateInput,
): Promise<Group> {
  const group = await requireGroup(repository, groupId);
  assertGroupOwner(group, viewerUid);
  const value = validateGroupUpdateOrThrow(input);

  return repository.updateGroup(group.id, {
    ...value,
    updatedAt: new Date().toISOString(),
  });
}

export async function removeGroupMemberRecord(
  repository: GroupWriteDeps["repository"],
  viewerUid: string,
  groupId: string,
  memberId: string,
): Promise<Group> {
  const group = await requireGroup(repository, groupId);
  assertGroupOwner(group, viewerUid);
  const target = typeof memberId === "string" ? memberId.trim() : "";
  if (target.length === 0) throw new GroupOperationError("MEMBER_NOT_FOUND");

  return repository.removeMember(group.id, target, new Date().toISOString());
}

export async function inviteGroupMembers(
  deps: GroupWriteDeps,
  viewerUid: string,
  groupId: string,
  inviteeIds: readonly string[],
): Promise<GroupInvitation[]> {
  const group = await requireGroup(deps.repository, groupId);
  assertGroupOwner(group, viewerUid);
  const ids = validateInviteesOrThrow(inviteeIds, viewerUid);
  // One read: every pending invitation of the group reserves a seat.
  const pending = filterPendingInvitations(
    await deps.repository.getGroupInvitations(group.ownerId, group.id),
  );
  // No seat at all: fail before reading the friend list. The exact
  // members + pending + new fit is checked in `inviteMembersToGroup`.
  assertGroupNotFull(group, pending.length);

  return inviteMembersToGroup(deps, viewerUid, group, ids, pending);
}

export async function acceptGroupInvitation(
  { repository, friendsRepository }: GroupWriteDeps,
  viewerUid: string,
  invitationId: string,
): Promise<Group> {
  const invitation = await requireGroupInvitation(repository, invitationId);
  assertInvitationInvitee(invitation, viewerUid);
  assertInvitationPending(invitation);
  await assertFriendshipExists(friendsRepository, invitation.pairId);

  return repository.acceptInvitation(viewerUid, invitation.id);
}

export async function rejectGroupInvitation(
  repository: GroupWriteDeps["repository"],
  viewerUid: string,
  invitationId: string,
): Promise<GroupInvitation> {
  const invitation = await requireGroupInvitation(repository, invitationId);
  assertInvitationInvitee(invitation, viewerUid);
  assertInvitationPending(invitation);

  return repository.rejectInvitation(invitation.id, new Date().toISOString());
}

export async function cancelGroupInvitation(
  repository: GroupWriteDeps["repository"],
  viewerUid: string,
  invitationId: string,
): Promise<GroupInvitation> {
  const invitation = await requireGroupInvitation(repository, invitationId);
  if (invitation.inviterId !== viewerUid) {
    throw new GroupOperationError("NOT_GROUP_OWNER");
  }
  assertInvitationPending(invitation);

  return repository.cancelInvitation(invitation.id, new Date().toISOString());
}
