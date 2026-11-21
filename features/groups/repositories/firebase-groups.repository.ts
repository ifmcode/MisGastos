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
import { acceptGroupInvitationOperation } from "./group-accept.operation";
import { createGroupWithInvitationsOperation } from "./group-create.operation";
import {
  createGroupJoinRequestOperation,
  ensureGroupJoinCodeOperation,
  respondToGroupJoinRequestOperation,
} from "./group-join.operations";
import {
  getGroupCodeOperation,
  getGroupJoinRequestOperation,
  getGroupJoinRequestsOperation,
} from "./group-join-read.operations";
import {
  inviteMembersOperation,
  updateGroupInvitationStatusOperation,
} from "./group-invitation.operations";
import {
  removeGroupMemberOperation,
  updateGroupOperation,
} from "./group-update.operations";
import type { IGroupsRepository } from "./groups.repository";
import {
  getGroupInvitationOperation,
  getGroupInvitationsOperation,
  getGroupOperation,
  getGroupsOperation,
  getPendingInvitationsOperation,
} from "./groups.operations";

export class FirebaseGroupsRepository implements IGroupsRepository {
  createGroupWithInvitations(
    input: CreateGroupWithInvitationsInput,
  ): Promise<CreateGroupWithInvitationsResult> {
    return createGroupWithInvitationsOperation(input);
  }

  getGroups(memberId: string): Promise<Group[]> {
    return getGroupsOperation(memberId);
  }

  getGroup(groupId: string): Promise<Group | null> {
    return getGroupOperation(groupId);
  }

  updateGroup(groupId: string, update: GroupMetadataUpdate): Promise<Group> {
    return updateGroupOperation(groupId, update);
  }

  removeMember(
    groupId: string,
    memberId: string,
    updatedAt: string,
  ): Promise<Group> {
    return removeGroupMemberOperation(groupId, memberId, updatedAt);
  }

  getGroupInvitation(
    invitationId: string,
  ): Promise<GroupInvitation | null> {
    return getGroupInvitationOperation(invitationId);
  }

  getGroupInvitations(
    inviterId: string,
    groupId: string,
  ): Promise<GroupInvitation[]> {
    return getGroupInvitationsOperation(inviterId, groupId);
  }

  getPendingInvitations(inviteeId: string): Promise<GroupInvitation[]> {
    return getPendingInvitationsOperation(inviteeId);
  }

  inviteMembers(input: InviteMembersInput): Promise<GroupInvitation[]> {
    return inviteMembersOperation(input);
  }

  acceptInvitation(viewerUid: string, invitationId: string): Promise<Group> {
    return acceptGroupInvitationOperation(viewerUid, invitationId);
  }

  rejectInvitation(
    invitationId: string,
    updatedAt: string,
  ): Promise<GroupInvitation> {
    return updateGroupInvitationStatusOperation(
      invitationId,
      "rejected",
      updatedAt,
    );
  }

  cancelInvitation(
    invitationId: string,
    updatedAt: string,
  ): Promise<GroupInvitation> {
    return updateGroupInvitationStatusOperation(
      invitationId,
      "cancelled",
      updatedAt,
    );
  }

  getGroupCode(code: string): Promise<GroupCode | null> {
    return getGroupCodeOperation(code);
  }

  getGroupJoinRequest(requestId: string): Promise<GroupJoinRequest | null> {
    return getGroupJoinRequestOperation(requestId);
  }

  getGroupJoinRequests(groupId: string): Promise<GroupJoinRequest[]> {
    return getGroupJoinRequestsOperation(groupId);
  }

  createGroupJoinRequest(
    input: CreateGroupJoinRequestInput,
  ): Promise<GroupJoinRequest> {
    return createGroupJoinRequestOperation(input);
  }

  respondToGroupJoinRequest(
    input: RespondToGroupJoinRequestInput,
  ): Promise<{ group: Group; request: GroupJoinRequest }> {
    return respondToGroupJoinRequestOperation(input);
  }

  ensureGroupJoinCode(input: EnsureGroupJoinCodeInput): Promise<Group> {
    return ensureGroupJoinCodeOperation(input);
  }
}
