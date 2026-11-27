import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { assertServerSnapshot } from "@/shared/lib/local-db/offline-read";

import { FriendOperationError } from "../services/friend.errors";
import type {
  CreateFriendRequestDto,
  FriendRequest,
  FriendRequestUpdate,
} from "../types/friend.types";
import { mapFriendRequestDocument } from "./friends.mapper";

export const FRIEND_REQUESTS_COLLECTION = "friendRequests";

export async function getFriendRequestOperation(
  requestId: string,
): Promise<FriendRequest | null> {
  const snapshot = await getDoc(doc(db, FRIEND_REQUESTS_COLLECTION, requestId));
  if (!snapshot.exists()) return null;

  return mapFriendRequestDocument(
    snapshot.id,
    snapshot.data() as Record<string, unknown>,
  );
}

/** `array-contains` on the immutable sorted pair; no composite index needed. */
export async function getFriendRequestsOperation(
  uid: string,
): Promise<FriendRequest[]> {
  const snapshot = await getDocs(
    query(
      collection(db, FRIEND_REQUESTS_COLLECTION),
      where("participantIds", "array-contains", uid),
    ),
  );
  assertServerSnapshot(snapshot);

  const requests: FriendRequest[] = [];

  for (const document of snapshot.docs) {
    const request = mapFriendRequestDocument(
      document.id,
      document.data() as Record<string, unknown>,
    );
    if (request) requests.push(request);
  }

  return requests;
}

export async function createFriendRequestOperation(
  dto: CreateFriendRequestDto,
): Promise<FriendRequest> {
  const data = {
    requesterId: dto.requesterId,
    recipientId: dto.recipientId,
    participantIds: dto.participantIds,
    status: dto.status,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };

  await setDoc(doc(db, FRIEND_REQUESTS_COLLECTION, dto.id), data);

  const request = mapFriendRequestDocument(dto.id, data);
  if (!request) throw new FriendOperationError("REQUEST_NOT_FOUND");

  return request;
}

/** Reject, cancel and re-open. `participantIds` and `createdAt` are untouched. */
export async function updateFriendRequestOperation(
  requestId: string,
  update: FriendRequestUpdate,
): Promise<FriendRequest> {
  const data: Record<string, unknown> = {
    status: update.status,
    updatedAt: update.updatedAt,
  };

  if (update.requesterId) data.requesterId = update.requesterId;
  if (update.recipientId) data.recipientId = update.recipientId;

  await updateDoc(doc(db, FRIEND_REQUESTS_COLLECTION, requestId), data);

  const request = await getFriendRequestOperation(requestId);
  if (!request) throw new FriendOperationError("REQUEST_NOT_FOUND");

  return request;
}

export async function deleteFriendRequestOperation(
  requestId: string,
): Promise<void> {
  await deleteDoc(doc(db, FRIEND_REQUESTS_COLLECTION, requestId));
}
