import type { FriendProfile } from "@/features/friends/types/friend.types";

/**
 * Join-code alphabet: 32 unambiguous characters, no `0`/`O`/`1`/`I`, so a code
 * can be read aloud or typed from a screenshot without confusion.
 */
export const GROUP_JOIN_CODE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

/** 8 characters over a 32-symbol alphabet: 40 bits of entropy. */
export const GROUP_JOIN_CODE_LENGTH = 8;

/** `accepted`/`rejected` are terminal; only `pending` can move. `cancelled` is
 * reserved by the ticket schema but has no producer in this release. */
export type GroupJoinRequestStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "cancelled";

export const GROUP_JOIN_REQUEST_STATUSES: readonly GroupJoinRequestStatus[] = [
  "pending",
  "accepted",
  "rejected",
  "cancelled",
];

/**
 * `groupCodes/{code}` projection, readable with `get` by any signed-in user so
 * a code can be resolved without exposing the group document. `list` is denied.
 */
export interface GroupCode {
  code: string;
  groupId: string;
  ownerId: string;
  groupName: string;
}

/**
 * `groupJoinRequests/{groupId}__{requesterId}` document. The deterministic id
 * means one request per group and requester; no `ownerId` is denormalized, so
 * the owner is proven with a group read in the rules and the transaction.
 */
export interface GroupJoinRequest {
  id: string;
  groupId: string;
  requesterId: string;
  joinCode: string;
  status: GroupJoinRequestStatus;
  createdAt: string;
  updatedAt: string;
}

/** Pending request plus the requester profile when it can be resolved. */
export interface GroupJoinRequestItem {
  request: GroupJoinRequest;
  requester: FriendProfile | null;
}

/** A code resolved for a non-member; never carries the group document. */
export interface GroupJoinLookup {
  code: string;
  groupId: string;
  ownerId: string;
  groupName: string;
  membership: "none" | "member";
  requestStatus: GroupJoinRequestStatus | null;
}

export interface CreateGroupJoinRequestInput {
  groupId: string;
  requesterId: string;
  joinCode: string;
  createdAt: string;
}

export interface RespondToGroupJoinRequestInput {
  requestId: string;
  groupId: string;
  viewerUid: string;
  decision: "accepted" | "rejected";
  updatedAt: string;
}

/** Lazy backfill of a legacy group without a join code. */
export interface EnsureGroupJoinCodeInput {
  groupId: string;
  code: string;
  updatedAt: string;
}
