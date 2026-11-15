import type {
  FriendRelation,
  FriendRequest,
  Friendship,
} from "../types/friend.types";

export interface FriendRelationContext {
  friendships: readonly Friendship[];
  requests: readonly FriendRequest[];
}

export interface FriendRelationResult {
  relation: FriendRelation;
  requestId: string | null;
}

function isPair(ids: readonly string[], uidA: string, uidB: string): boolean {
  return ids.includes(uidA) && ids.includes(uidB);
}

export function findFriendship(
  friendships: readonly Friendship[],
  uidA: string,
  uidB: string,
): Friendship | null {
  return (
    friendships.find((friendship) =>
      isPair(friendship.memberIds, uidA, uidB),
    ) ?? null
  );
}

/** Pending request of a pair, regardless of who sent it. */
export function findPendingRequest(
  requests: readonly FriendRequest[],
  uidA: string,
  uidB: string,
): FriendRequest | null {
  return (
    requests.find(
      (request) =>
        request.status === "pending" &&
        isPair(request.participantIds, uidA, uidB),
    ) ?? null
  );
}

/**
 * Relation between the signed-in user and a search result:
 * `self` for the own profile, `friend` for an accepted pair, `outgoing` when
 * the viewer already asked and `incoming` when the other user asked.
 */
export function resolveFriendRelation(
  viewerUid: string,
  targetUid: string,
  context: FriendRelationContext,
): FriendRelationResult {
  if (viewerUid === targetUid) return { relation: "self", requestId: null };
  if (viewerUid.length === 0 || targetUid.length === 0) {
    return { relation: "none", requestId: null };
  }

  if (findFriendship(context.friendships, viewerUid, targetUid)) {
    return { relation: "friend", requestId: null };
  }

  const request = findPendingRequest(context.requests, viewerUid, targetUid);
  if (!request) return { relation: "none", requestId: null };

  if (request.requesterId === viewerUid) {
    return { relation: "outgoing", requestId: request.id };
  }

  if (request.recipientId === viewerUid) {
    return { relation: "incoming", requestId: request.id };
  }

  return { relation: "none", requestId: null };
}
