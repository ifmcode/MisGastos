import type {
  CreateGroupWithInvitationsInput,
  CreateGroupWithInvitationsResult,
  Group,
  GroupInvitation,
  GroupMetadataUpdate,
  InviteMembersInput,
} from "../types/group.types";
import type {
  CreateGroupJoinRequestInput,
  EnsureGroupJoinCodeInput,
  GroupCode,
  GroupJoinRequest,
  RespondToGroupJoinRequestInput,
} from "../types/group-join.types";

/**
 * Persistence contract of groups and their invitations. Every method returns
 * mapped entities or a stable domain error; Firestore errors are never
 * disguised (a denied group read stays `permission-denied` for the service to
 * map).
 */
export interface IGroupsRepository {
  /** One batch: the group plus every pending invitation. */
  createGroupWithInvitations(
    input: CreateGroupWithInvitationsInput,
  ): Promise<CreateGroupWithInvitationsResult>;

  /** `array-contains` on the member list; the service sorts client-side. */
  getGroups(memberId: string): Promise<Group[]>;

  getGroup(groupId: string): Promise<Group | null>;

  /** Metadata edit; a rename also refreshes pending invitation names. */
  updateGroup(groupId: string, update: GroupMetadataUpdate): Promise<Group>;

  /** Owner removal of one member in a transaction. */
  removeMember(
    groupId: string,
    memberId: string,
    updatedAt: string,
  ): Promise<Group>;

  getGroupInvitation(invitationId: string): Promise<GroupInvitation | null>;

  /** Invitations the owner sent for one group; queried by `inviterId`. */
  getGroupInvitations(
    inviterId: string,
    groupId: string,
  ): Promise<GroupInvitation[]>;

  /** Received invitations, pending only, newest first. */
  getPendingInvitations(inviteeId: string): Promise<GroupInvitation[]>;

  /** Creates or re-opens every invitee, skipping pending ones. */
  inviteMembers(input: InviteMembersInput): Promise<GroupInvitation[]>;

  /** Invitee acceptance: invitation + member list in one transaction. */
  acceptInvitation(viewerUid: string, invitationId: string): Promise<Group>;

  rejectInvitation(
    invitationId: string,
    updatedAt: string,
  ): Promise<GroupInvitation>;

  cancelInvitation(
    invitationId: string,
    updatedAt: string,
  ): Promise<GroupInvitation>;

  /** Code projection read; `null` for an unknown or malformed code. */
  getGroupCode(code: string): Promise<GroupCode | null>;

  getGroupJoinRequest(requestId: string): Promise<GroupJoinRequest | null>;

  /** Requests of one group, oldest first; no composite index. */
  getGroupJoinRequests(groupId: string): Promise<GroupJoinRequest[]>;

  /** Deterministic create; a duplicate is a denied Firestore update. */
  createGroupJoinRequest(
    input: CreateGroupJoinRequestInput,
  ): Promise<GroupJoinRequest>;

  /** Owner accept/reject in one transaction. */
  respondToGroupJoinRequest(
    input: RespondToGroupJoinRequestInput,
  ): Promise<{ group: Group; request: GroupJoinRequest }>;

  /** Lazy, idempotent backfill of a legacy group join code. */
  ensureGroupJoinCode(input: EnsureGroupJoinCodeInput): Promise<Group>;
}
