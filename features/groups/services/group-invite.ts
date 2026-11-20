import type { Group, GroupInvitation } from "../types/group.types";
import { getGroupInviteCapacity } from "../utils/group-invite-eligibility";
import { normalizeGroupInviteeIds } from "../utils/group-membership";
import type { GroupWriteDeps } from "./group-deps";
import { GroupOperationError } from "./group.errors";
import { assertInviteesAreFriends, loadFriendUids } from "./group-friendship";
import { notifyGroupInvitations } from "./group-notify";

/**
 * Extra invite round. A pending invitation reserves a seat, so the capacity
 * check counts members + pending + new together and the owner can never queue
 * more invitations than the group can honour. Members and friends with a
 * pending invitation are skipped silently; a non-friend is a NOT_FRIEND error.
 */
export async function inviteMembersToGroup(
  { repository, friendsRepository, notifications }: GroupWriteDeps,
  viewerUid: string,
  group: Group,
  inviteeIds: readonly string[],
  pendingInvitations: readonly GroupInvitation[] = [],
): Promise<GroupInvitation[]> {
  const pendingIds = pendingInvitations.map((item) => item.inviteeId);
  const candidates = normalizeGroupInviteeIds(inviteeIds).filter(
    (inviteeId) =>
      !group.memberIds.includes(inviteeId) && !pendingIds.includes(inviteeId),
  );
  if (candidates.length === 0) return [];

  const friendUids = await loadFriendUids(friendsRepository, viewerUid);
  assertInviteesAreFriends(candidates, friendUids);

  if (
    getGroupInviteCapacity(group.memberIds, pendingIds.length) <
    candidates.length
  ) {
    throw new GroupOperationError("GROUP_FULL");
  }

  const invitations = await repository.inviteMembers({
    groupId: group.id,
    groupName: group.name,
    inviterId: group.ownerId,
    inviteeIds: candidates,
    updatedAt: new Date().toISOString(),
  });

  await notifyGroupInvitations(notifications, invitations);

  return invitations;
}
