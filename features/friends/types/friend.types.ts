/** Minimal identity shared with other signed-in users. */
export interface FriendProfile {
  uid: string;
  displayName: string | null;
  email: string;
}

/** `publicProfiles/{uid}` document: readable by signed-in users, owner-writable. */
export interface PublicProfile extends FriendProfile {
  createdAt: string;
  updatedAt: string;
}

/**
 * Stored request states. `accepted` is not stored: accepting deletes the
 * request and creates the friendship document instead.
 */
export type FriendRequestStatus = "pending" | "rejected" | "cancelled";

export const FRIEND_REQUEST_STATUSES: readonly FriendRequestStatus[] = [
  "pending",
  "rejected",
  "cancelled",
];

export interface FriendRequest {
  id: string;
  requesterId: string;
  recipientId: string;
  /** Sorted pair, immutable. Its join is also the document id. */
  participantIds: string[];
  status: FriendRequestStatus;
  createdAt: string;
  updatedAt: string;
}

/** Accepted relationship; the single source of truth after an accept. */
export interface Friendship {
  id: string;
  memberIds: string[];
  requesterId: string;
  recipientId: string;
  createdAt: string;
}

export interface Friend {
  uid: string;
  displayName: string | null;
  email: string;
  /** Positive: the friend owes the viewer. Negative: the viewer owes. */
  netBalanceCents: number;
  /** Creation date of the friendship. */
  since: string;
}

export type FriendRequestDirection = "incoming" | "outgoing";

export interface FriendRequestItem {
  requestId: string;
  profile: FriendProfile;
  status: FriendRequestStatus;
  createdAt: string;
  updatedAt: string;
  direction: FriendRequestDirection;
}

export type FriendRelation =
  | "none"
  | "self"
  | "friend"
  | "outgoing"
  | "incoming";

export interface FriendSearchResult {
  profile: PublicProfile;
  relation: FriendRelation;
  /** Pending request id when the relation is `outgoing` or `incoming`. */
  requestId: string | null;
}

export interface FriendsOverview {
  friends: Friend[];
  incoming: FriendRequestItem[];
  outgoing: FriendRequestItem[];
}

/** Append-only ledger entry: `fromUserId` owes `toUserId`. */
export interface FriendLedgerEntry {
  id: string;
  fromUserId: string;
  toUserId: string;
  amountCents: number;
  deletedAt: string | null;
}

/** Input of `ensurePublicProfile`; the service normalizes it before writing. */
export interface PublicProfileInput {
  uid: string;
  displayName: string | null;
  email: string;
}

export interface SendFriendRequestInput {
  requesterId: string;
  recipientId: string;
}

export interface ValidatedFriendRequestPair {
  requesterId: string;
  recipientId: string;
  participantIds: string[];
}

export interface CreateFriendRequestDto {
  id: string;
  requesterId: string;
  recipientId: string;
  participantIds: string[];
  status: FriendRequestStatus;
  createdAt: string;
  updatedAt: string;
}

/** Allowed transitions: cancel, reject and re-open to pending. */
export interface FriendRequestUpdate {
  status: FriendRequestStatus;
  requesterId?: string;
  recipientId?: string;
  updatedAt: string;
}
