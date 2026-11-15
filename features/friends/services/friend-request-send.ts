import type { IFriendsRepository } from "../repositories/friends.repository";
import type {
  FriendRequest,
  ValidatedFriendRequestPair,
} from "../types/friend.types";
import { createFriendPairId } from "../utils/friend-pair";
import { FriendOperationError } from "./friend.errors";

/**
 * Sends or re-opens the deterministic request document of a pair. A re-send
 * after `rejected`/`cancelled` reuses the same document and sets it back to
 * `pending`, swapping requester/recipient when the other user now asks.
 */
export async function sendFriendRequestWithRepository(
  repository: IFriendsRepository,
  pair: ValidatedFriendRequestPair,
): Promise<FriendRequest> {
  const recipient = await repository.getPublicProfile(pair.recipientId);
  if (!recipient) throw new FriendOperationError("USER_NOT_FOUND");

  const pairId = createFriendPairId(pair.requesterId, pair.recipientId);
  if (pairId.length === 0) throw new FriendOperationError("SELF_REQUEST");

  const friendship = await repository.getFriendship(pairId);
  if (friendship) throw new FriendOperationError("ALREADY_FRIENDS");

  const existing = await repository.getFriendRequest(pairId);
  const now = new Date().toISOString();

  if (!existing) {
    return repository.createFriendRequest({
      id: pairId,
      requesterId: pair.requesterId,
      recipientId: pair.recipientId,
      participantIds: pair.participantIds,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });
  }

  if (existing.status === "pending") {
    throw new FriendOperationError(
      existing.requesterId === pair.requesterId
        ? "DUPLICATE_REQUEST"
        : "INCOMING_REQUEST_EXISTS",
    );
  }

  return repository.updateFriendRequest(pairId, {
    status: "pending",
    requesterId: pair.requesterId,
    recipientId: pair.recipientId,
    updatedAt: now,
  });
}
