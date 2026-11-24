import type {
  Group,
  GroupInvitation,
  GroupUpdateInput,
} from "../types/group.types";
import { filterPendingInvitations } from "../utils/group-list";
import type { GroupWriteDeps } from "./group-deps";
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

  return repository.updateGroup(viewerUid, group.id, {
    ...value,
    updatedAt: new Date().toISOString(),
  });
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
    await deps.repository.getGroupInvitations(group.id),
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
  // Only the current group owner cancels: after a transfer the invitation may
  // still name the previous owner, who must not keep that power.
  const group = await requireGroup(repository, invitation.groupId);
  assertGroupOwner(group, viewerUid);
  assertInvitationPending(invitation);

  return repository.cancelInvitation(invitation.id, new Date().toISOString());
}
