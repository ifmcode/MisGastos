import type { IFriendsRepository } from "../repositories/friends.repository";
import type { FriendRequest } from "../types/friend.types";
import {
  assertViewerIsRecipient,
  assertViewerIsSender,
} from "./friend-guards";

/** Recipient-only rejection of a pending request. */
export async function rejectFriendRequestWithRepository(
  repository: IFriendsRepository,
  viewerUid: string,
  request: FriendRequest,
): Promise<FriendRequest> {
  assertViewerIsRecipient(request, viewerUid);

  return repository.updateFriendRequest(request.id, {
    status: "rejected",
    updatedAt: new Date().toISOString(),
  });
}

/** Sender-only cancellation of a pending request. */
export async function cancelFriendRequestWithRepository(
  repository: IFriendsRepository,
  viewerUid: string,
  request: FriendRequest,
): Promise<FriendRequest> {
  assertViewerIsSender(request, viewerUid);

  return repository.updateFriendRequest(request.id, {
    status: "cancelled",
    updatedAt: new Date().toISOString(),
  });
}
