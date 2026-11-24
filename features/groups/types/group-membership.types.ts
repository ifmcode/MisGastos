import type { Group, GroupInvitationItem } from "./group.types";

/** Role of one accepted member, derived from the group owner. */
export type GroupMemberRole = "owner" | "member";

/** One accepted member resolved with their public profile. */
export interface GroupMember {
  uid: string;
  displayName: string | null;
  email: string;
  role: GroupMemberRole;
}

/** Group plus its member-resolved detail, used by the detail screen. */
export interface GroupDetail {
  group: Group;
  members: GroupMember[];
  invitations: GroupInvitationItem[];
}

/**
 * Owner removal of one member. `actorId` and `targetName` feed the
 * `member-removed` history event: the name is a snapshot because the member
 * leaves `memberIds`.
 */
export interface RemoveGroupMemberInput {
  groupId: string;
  actorId: string;
  memberId: string;
  targetName: string | null;
  updatedAt: string;
}

/**
 * A non-owner leaves by themselves. There is no separate actor: the leaving
 * member is the caller the rules verify, and `targetName` is the snapshot the
 * `member-left` event needs once the uid is gone from `memberIds`.
 */
export interface LeaveGroupInput {
  groupId: string;
  memberId: string;
  targetName: string | null;
  updatedAt: string;
}

/**
 * Owner promotes one active member. The actor must be the current owner inside
 * the transaction; the member set is only reordered owner-first.
 */
export interface TransferGroupOwnershipInput {
  groupId: string;
  actorId: string;
  newOwnerId: string;
  updatedAt: string;
}
