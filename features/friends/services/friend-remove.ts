import type { IFriendsRepository } from "../repositories/friends.repository";
import { createFriendPairId } from "../utils/friend-pair";
import { FriendOperationError } from "./friend.errors";

/**
 * Removes a friendship. Either member can remove the other (no blocking), the
 * document id is the deterministic pair id and the balance is derived, so there
 * is no record to rewrite.
 */
export async function removeFriendWithRepository(
  repository: IFriendsRepository,
  viewerUid: string,
  friendUid: string,
): Promise<void> {
  const friendshipId = createFriendPairId(viewerUid, friendUid);
  const friendship = friendshipId
    ? await repository.getFriendship(friendshipId)
    : null;

  if (!friendship || !friendship.memberIds.includes(viewerUid)) {
    throw new FriendOperationError("FRIEND_NOT_FOUND");
  }

  await repository.deleteFriendship(friendship.id);
}
