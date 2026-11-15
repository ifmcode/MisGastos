import type {
  Friend,
  FriendLedgerEntry,
  FriendProfile,
  FriendRequest,
  FriendRequestItem,
  Friendship,
  FriendsOverview,
} from "../types/friend.types";
import { calculateFriendNetBalance } from "../utils/friend-balance";
import { getFriendDisplayName } from "../utils/friend-display";
import { getOtherMemberId } from "../utils/friend-pair";

export interface FriendsOverviewInput {
  viewerUid: string;
  friendships: readonly Friendship[];
  requests: readonly FriendRequest[];
  profiles: readonly FriendProfile[];
  ledgerEntries: readonly FriendLedgerEntry[];
}

const FALLBACK_PROFILE: Omit<FriendProfile, "uid"> = {
  displayName: null,
  email: "",
};

function toProfile(
  uid: string,
  profileById: ReadonlyMap<string, FriendProfile>,
): FriendProfile {
  return profileById.get(uid) ?? { uid, ...FALLBACK_PROFILE };
}

// Fixed collation so the order of the friends list does not depend on the
// device locale; the uid tie-breaker keeps it fully deterministic.
export function compareFriends(left: Friend, right: Friend): number {
  const byName = getFriendDisplayName(left).localeCompare(
    getFriendDisplayName(right),
    "en",
    { sensitivity: "base" },
  );
  if (byName !== 0) return byName;

  return left.uid.localeCompare(right.uid);
}

function buildFriends(
  viewerUid: string,
  friendships: readonly Friendship[],
  ledgerEntries: readonly FriendLedgerEntry[],
  profileById: ReadonlyMap<string, FriendProfile>,
): Friend[] {
  const friends = new Map<string, Friend>();

  for (const friendship of friendships) {
    const uid = getOtherMemberId(friendship.memberIds, viewerUid);
    if (!uid || friends.has(uid)) continue;

    const profile = toProfile(uid, profileById);

    friends.set(uid, {
      uid,
      displayName: profile.displayName,
      email: profile.email,
      netBalanceCents: calculateFriendNetBalance(
        ledgerEntries,
        viewerUid,
        uid,
      ),
      since: friendship.createdAt,
    });
  }

  return Array.from(friends.values()).sort(compareFriends);
}

function buildRequestItem(
  viewerUid: string,
  request: FriendRequest,
  profileById: ReadonlyMap<string, FriendProfile>,
): FriendRequestItem | null {
  const uid = getOtherMemberId(request.participantIds, viewerUid);
  if (!uid) return null;

  return {
    requestId: request.id,
    profile: toProfile(uid, profileById),
    status: request.status,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
    direction: request.requesterId === viewerUid ? "outgoing" : "incoming",
  };
}

function compareRequestItems(
  left: FriendRequestItem,
  right: FriendRequestItem,
): number {
  const byDate = right.createdAt.localeCompare(left.createdAt);
  if (byDate !== 0) return byDate;

  return left.requestId.localeCompare(right.requestId);
}

/** Profile ids needed by the overview: friends plus pending request peers. */
export function collectOverviewProfileIds(
  viewerUid: string,
  friendships: readonly Friendship[],
  requests: readonly FriendRequest[],
): string[] {
  const ids = new Set<string>();

  for (const friendship of friendships) {
    const uid = getOtherMemberId(friendship.memberIds, viewerUid);
    if (uid) ids.add(uid);
  }

  for (const request of requests) {
    if (request.status !== "pending") continue;

    const uid = getOtherMemberId(request.participantIds, viewerUid);
    if (uid) ids.add(uid);
  }

  return Array.from(ids);
}

export function buildFriendsOverview(input: FriendsOverviewInput): FriendsOverview {
  const { viewerUid, friendships, requests, profiles, ledgerEntries } = input;
  const profileById = new Map(profiles.map((profile) => [profile.uid, profile]));

  const items = requests
    .filter((request) => request.status === "pending")
    .map((request) => buildRequestItem(viewerUid, request, profileById))
    .filter((item): item is FriendRequestItem => !!item)
    .sort(compareRequestItems);

  return {
    friends: buildFriends(viewerUid, friendships, ledgerEntries, profileById),
    incoming: items.filter((item) => item.direction === "incoming"),
    outgoing: items.filter((item) => item.direction === "outgoing"),
  };
}
