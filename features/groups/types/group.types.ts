import type { FriendProfile } from "@/features/friends/types/friend.types";
import type { CurrencyCode } from "@/shared/constants/currencies";

/** Owner included; mirrored by `firestore.rules` and the group schema. */
export const GROUP_MAX_MEMBERS = 20;

/** Every member but the owner; a creation starts with at least one. */
export const GROUP_MAX_INVITEES = GROUP_MAX_MEMBERS - 1;

export const GROUP_NAME_MAX_LENGTH = 60;
export const GROUP_DESCRIPTION_MAX_LENGTH = 200;

/** `accepted` is stored: an invitation is the only way into a group. */
export type GroupInvitationStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "cancelled";

export const GROUP_INVITATION_STATUSES: readonly GroupInvitationStatus[] = [
  "pending",
  "accepted",
  "rejected",
  "cancelled",
];

export type GroupMemberRole = "owner" | "member";

/**
 * `groups/{groupId}` document. `memberIds` is owner-first, unique and holds
 * accepted members only; `defaultCurrency` is the default for future group
 * expenses, not a fixed ledger currency.
 */
export interface Group {
  id: string;
  ownerId: string;
  memberIds: string[];
  name: string;
  description: string | null;
  defaultCurrency: CurrencyCode;
  /** Stable shareable code; `null` only for groups created before TICKET-061. */
  joinCode: string | null;
  /**
   * **Simplificar deudas** (TICKET-010): the owner setting that switches the
   * suggested transfers between simplified and direct. Missing on legacy groups
   * maps to `true`, so they keep simplifying.
   */
  simplifyDebts: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * `groupInvitations/{groupId}__{inviteeId}` document. The id is deterministic,
 * so re-inviting reopens the same document instead of creating a second one.
 */
export interface GroupInvitation {
  id: string;
  groupId: string;
  /** Denormalized so the invitee list does not read the group. */
  groupName: string;
  inviterId: string;
  inviteeId: string;
  /** Sorted inviter/invitee pair id; its join also guards the invitation. */
  pairId: string;
  status: GroupInvitationStatus;
  createdAt: string;
  updatedAt: string;
}

/** Raw creation form: invitees are accepted friends, never members yet. */
export interface GroupInput {
  name: string;
  description: string | null;
  defaultCurrency: CurrencyCode;
  inviteeIds: string[];
}

/** Metadata-only owner edit; the form always sends the simplify toggle. */
export interface GroupUpdateInput extends ValidatedGroupMetadata {}

/** Validated metadata shared by creation and update. */
export interface ValidatedGroupMetadata {
  name: string;
  description: string | null;
  defaultCurrency: CurrencyCode;
  /** `true` on creation; the owner edits it on update (missing = true). */
  simplifyDebts: boolean;
}

export interface ValidatedGroup extends ValidatedGroupMetadata {
  inviteeIds: string[];
}

export interface GroupMember {
  uid: string;
  displayName: string | null;
  email: string;
  role: GroupMemberRole;
}

/** Pending invitation of one group with the invitee profile when available. */
export interface GroupInvitationItem {
  invitation: GroupInvitation;
  invitee: FriendProfile | null;
}

/** Received invitation list row, resolved with the inviter profile. */
export interface PendingGroupInvitationItem {
  invitationId: string;
  groupId: string;
  groupName: string;
  inviterId: string;
  inviter: FriendProfile | null;
  createdAt: string;
}

export interface GroupDetail {
  group: Group;
  members: GroupMember[];
  invitations: GroupInvitationItem[];
}

/** Metadata write; the service stamps `updatedAt` before persistence. */
export interface GroupMetadataUpdate extends ValidatedGroupMetadata {
  updatedAt: string;
}

export interface CreateGroupWithInvitationsInput {
  ownerId: string;
  name: string;
  description: string | null;
  defaultCurrency: CurrencyCode;
  inviteeIds: readonly string[];
  createdAt: string;
}

export interface CreateGroupWithInvitationsResult {
  group: Group;
  invitations: GroupInvitation[];
}

export interface InviteMembersInput {
  groupId: string;
  groupName: string;
  inviterId: string;
  inviteeIds: readonly string[];
  updatedAt: string;
}
