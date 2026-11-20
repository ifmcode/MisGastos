import type { Friendship } from "@/features/friends/types/friend.types";
import { getOtherMemberId } from "@/features/friends/utils/friend-pair";

import { GROUP_MAX_MEMBERS } from "../types/group.types";

function readUid(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/** A group is born with its owner as the only accepted member. */
export function prepareGroupMemberIds(ownerId: unknown): string[] {
  const owner = readUid(ownerId);

  return owner.length > 0 ? [owner] : [];
}

/**
 * Trims, de-duplicates and puts the owner first, which is the order the rules
 * and the mapper require. An empty list stays empty.
 */
export function normalizeGroupMemberIds(
  ownerId: unknown,
  memberIds: readonly unknown[],
): string[] {
  const owner = readUid(ownerId);
  const unique: string[] = [];

  for (const value of memberIds) {
    const uid = readUid(value);
    if (uid.length > 0 && !unique.includes(uid)) unique.push(uid);
  }

  if (owner.length === 0) return unique;

  return [owner, ...unique.filter((uid) => uid !== owner)];
}

/** Append-only growth: the caller always lands after the owner. */
export function appendGroupMember(
  memberIds: readonly string[],
  memberId: unknown,
): string[] {
  const owner = memberIds[0] ?? "";
  const member = readUid(memberId);

  if (member.length === 0) return normalizeGroupMemberIds(owner, memberIds);

  return normalizeGroupMemberIds(owner, [...memberIds, member]);
}

/** Removes exactly one uid; the owner is filtered out only by the service. */
export function removeGroupMember(
  memberIds: readonly string[],
  memberId: unknown,
): string[] {
  const target = readUid(memberId);

  return memberIds
    .map((value) => readUid(value))
    .filter((uid) => uid.length > 0 && uid !== target);
}

export function isGroupMember(
  memberIds: readonly string[],
  uid: unknown,
): boolean {
  const viewer = readUid(uid);

  return viewer.length > 0 && memberIds.includes(viewer);
}

/** 20 members including the owner (GROUP_MAX_MEMBERS). */
export function isGroupFull(memberIds: readonly string[]): boolean {
  return memberIds.length >= GROUP_MAX_MEMBERS;
}

/** Accepted friends of the viewer, derived from the friendship pair. */
export function getFriendUids(
  friendships: readonly Friendship[],
  viewerUid: unknown,
): string[] {
  const viewer = readUid(viewerUid);
  if (viewer.length === 0) return [];

  const friendUids: string[] = [];

  for (const friendship of friendships) {
    const friendUid = getOtherMemberId(friendship.memberIds, viewer);
    if (friendUid && !friendUids.includes(friendUid)) friendUids.push(friendUid);
  }

  return friendUids;
}

export interface GroupInviteeEligibility {
  viewerUid: string;
  memberIds: readonly string[];
  pendingIds?: readonly string[];
  friendUids: readonly string[];
}

/** Only an accepted friend with a reserved seat can be invited. */
export function isEligibleGroupInvitee(
  uid: unknown,
  {
    viewerUid,
    memberIds,
    pendingIds = [],
    friendUids,
  }: GroupInviteeEligibility,
): boolean {
  const invitee = readUid(uid);
  if (invitee.length === 0 || invitee === readUid(viewerUid)) return false;

  return (
    friendUids.includes(invitee) &&
    !memberIds.includes(invitee) &&
    !pendingIds.includes(invitee)
  );
}

/**
 * Trims and de-duplicates an invitee list. Validation belongs to the schema;
 * this only guarantees no blank or repeated id ever reaches a write.
 */
export function normalizeGroupInviteeIds(
  inviteeIds: readonly unknown[],
): string[] {
  const unique: string[] = [];

  for (const value of inviteeIds) {
    const uid = readUid(value);
    if (uid.length > 0 && !unique.includes(uid)) unique.push(uid);
  }

  return unique;
}
