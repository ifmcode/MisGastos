import {
  FRIEND_REQUEST_STATUSES,
  FriendRequest,
  FriendRequestStatus,
  Friendship,
  PublicProfile,
} from "../types/friend.types";
import {
  getFriendPairMemberIds,
  isValidFriendPair,
} from "../utils/friend-pair";

function readText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function readTextOrNull(value: unknown): string | null {
  const text = readText(value);
  return text.length > 0 ? text : null;
}

function readStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => readText(item))
    .filter((item) => item.length > 0);
}

function readStatus(value: unknown): FriendRequestStatus {
  return FRIEND_REQUEST_STATUSES.includes(value as FriendRequestStatus)
    ? (value as FriendRequestStatus)
    : "pending";
}

/**
 * Converts a `publicProfiles` document. The identity always comes from the
 * document id so a malformed payload can never impersonate another uid.
 */
export function mapPublicProfileDocument(
  uid: string,
  data: Record<string, unknown>,
): PublicProfile {
  return {
    uid,
    displayName: readTextOrNull(data.displayName),
    email: readText(data.email),
    createdAt: readText(data.createdAt),
    updatedAt: readText(data.updatedAt),
  };
}

/**
 * Converts a `friendRequests` document. Requests without a usable pair are
 * dropped (null) instead of breaking the screen; the pair is rebuilt from the
 * requester/recipient when the stored array is legacy or corrupted.
 */
export function mapFriendRequestDocument(
  id: string,
  data: Record<string, unknown>,
): FriendRequest | null {
  const requesterId = readText(data.requesterId);
  const recipientId = readText(data.recipientId);
  if (requesterId.length === 0 || recipientId.length === 0) return null;

  const storedParticipantIds = readStringArray(data.participantIds);
  const participantIds =
    isValidFriendPair(storedParticipantIds) &&
    storedParticipantIds.includes(requesterId) &&
    storedParticipantIds.includes(recipientId)
      ? storedParticipantIds
      : getFriendPairMemberIds(requesterId, recipientId);

  if (participantIds.length !== 2) return null;

  return {
    id: id.trim(),
    requesterId,
    recipientId,
    participantIds,
    status: readStatus(data.status),
    createdAt: readText(data.createdAt),
    updatedAt: readText(data.updatedAt),
  };
}

/**
 * Converts a `friendships` document. `memberIds` is the only required field;
 * the requester/recipient pair falls back to the stored member order.
 */
export function mapFriendshipDocument(
  id: string,
  data: Record<string, unknown>,
): Friendship | null {
  let memberIds = readStringArray(data.memberIds);

  if (!isValidFriendPair(memberIds)) {
    memberIds = getFriendPairMemberIds(data.requesterId, data.recipientId);
  }

  if (!isValidFriendPair(memberIds)) return null;

  return {
    id: id.trim(),
    memberIds,
    requesterId: readText(data.requesterId) || memberIds[0],
    recipientId: readText(data.recipientId) || memberIds[1],
    createdAt: readText(data.createdAt),
  };
}
