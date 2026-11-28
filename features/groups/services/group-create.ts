import type { Group, ValidatedGroup } from "../types/group.types";
import type { GroupWriteDeps } from "./group-deps";
import { assertInviteesAreFriends, loadFriendUids } from "./group-friendship";

/**
 * Creation: every invitee must be an accepted friend, the group is written
 * with the owner as its only member, and every pending invitation lands in the
 * same batch. The invitations screen shows them as actionable cards, so no
 * notification is written.
 */
export async function createGroupWithFriends(
  { repository, friendsRepository }: GroupWriteDeps,
  viewerUid: string,
  value: ValidatedGroup,
): Promise<Group> {
  const friendUids = await loadFriendUids(friendsRepository, viewerUid);
  assertInviteesAreFriends(value.inviteeIds, friendUids);

  const { group } = await repository.createGroupWithInvitations({
    ownerId: viewerUid,
    name: value.name,
    description: value.description,
    defaultCurrency: value.defaultCurrency,
    inviteeIds: value.inviteeIds,
    createdAt: new Date().toISOString(),
  });

  return group;
}
