import { doc, runTransaction } from "firebase/firestore";

import { db } from "@/lib/firebase";

import { FriendOperationError } from "../services/friend.errors";
import type { Friendship } from "../types/friend.types";
import { mapFriendRequestDocument } from "./friends.mapper";
import {
  FRIEND_REQUESTS_COLLECTION,
} from "./friends-request.operations";
import { FRIENDSHIPS_COLLECTION } from "./friends-friendship.operations";

/**
 * Accepting is a two-document money-free write: the friendship document is
 * created with the deterministic pair id and the pending request is deleted in
 * the same transaction. `firestore.rules` validates the friendship create
 * against the pre-batch request (still pending, recipient is the caller).
 */
export async function acceptFriendRequestOperation(
  viewerUid: string,
  requestId: string,
): Promise<Friendship> {
  const now = new Date().toISOString();
  const requestRef = doc(db, FRIEND_REQUESTS_COLLECTION, requestId);
  let friendship: Friendship | null = null;

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(requestRef);
    if (!snapshot.exists()) {
      throw new FriendOperationError("REQUEST_NOT_FOUND");
    }

    const request = mapFriendRequestDocument(
      snapshot.id,
      snapshot.data() as Record<string, unknown>,
    );

    if (!request) throw new FriendOperationError("REQUEST_NOT_FOUND");
    if (!request.participantIds.includes(viewerUid)) {
      throw new FriendOperationError("NOT_REQUEST_RECIPIENT");
    }
    if (request.recipientId !== viewerUid) {
      throw new FriendOperationError("NOT_REQUEST_RECIPIENT");
    }
    if (request.status !== "pending") {
      throw new FriendOperationError("REQUEST_NOT_PENDING");
    }

    const data = {
      memberIds: request.participantIds,
      requesterId: request.requesterId,
      recipientId: request.recipientId,
      createdAt: now,
    };

    transaction.set(
      doc(db, FRIENDSHIPS_COLLECTION, request.id),
      data,
    );
    transaction.delete(requestRef);

    friendship = { id: request.id, ...data };
  });

  if (!friendship) throw new FriendOperationError("REQUEST_NOT_FOUND");

  return friendship;
}
