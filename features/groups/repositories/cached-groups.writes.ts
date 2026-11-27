import type {
  CreateGroupWithInvitationsInput,
  CreateGroupWithInvitationsResult,
  Group,
  GroupInvitation,
  GroupMetadataUpdate,
  InviteMembersInput,
  LeaveGroupInput,
  RemoveGroupMemberInput,
  TransferGroupOwnershipInput,
} from "../types/group.types";
import type {
  CreateGroupJoinRequestInput,
  EnsureGroupJoinCodeInput,
  GroupJoinRequest,
  RespondToGroupJoinRequestInput,
} from "../types/group-join.types";
import type { IGroupsRepository } from "./groups.repository";
import {
  cacheGroup,
  cacheGroupInvitation,
  cacheGroupInvitations,
} from "./local-groups.cache";
import { readCurrentOwnerId } from "@/shared/lib/local-db/current-owner";

/**
 * Write half of the cached groups repository. Group management stays online:
 * every call delegates to Firestore and mirrors the returned record, so the
 * offline read cache reflects what the server just stored.
 */
export class CachedGroupsWrites {
  constructor(protected readonly remote: IGroupsRepository) {}

  async createGroupWithInvitations(
    input: CreateGroupWithInvitationsInput,
  ): Promise<CreateGroupWithInvitationsResult> {
    const result = await this.remote.createGroupWithInvitations(input);
    await this.mirrorGroup(result.group);
    for (const invitation of result.invitations) {
      await this.mirrorInvitation(invitation);
    }
    return result;
  }

  async updateGroup(
    viewerUid: string,
    groupId: string,
    update: GroupMetadataUpdate,
  ): Promise<Group> {
    return this.mirrorGroup(
      await this.remote.updateGroup(viewerUid, groupId, update),
    );
  }

  async removeMember(input: RemoveGroupMemberInput): Promise<Group> {
    return this.mirrorGroup(await this.remote.removeMember(input));
  }

  async leaveGroup(input: LeaveGroupInput): Promise<Group> {
    return this.mirrorGroup(await this.remote.leaveGroup(input));
  }

  async transferOwnership(
    input: TransferGroupOwnershipInput,
  ): Promise<Group> {
    return this.mirrorGroup(await this.remote.transferOwnership(input));
  }

  async inviteMembers(
    input: InviteMembersInput,
  ): Promise<GroupInvitation[]> {
    const invitations = await this.remote.inviteMembers(input);
    for (const invitation of invitations) {
      await this.mirrorInvitation(invitation);
    }
    return invitations;
  }

  async acceptInvitation(
    viewerUid: string,
    invitationId: string,
  ): Promise<Group> {
    return this.mirrorGroup(
      await this.remote.acceptInvitation(viewerUid, invitationId),
    );
  }

  async rejectInvitation(
    invitationId: string,
    updatedAt: string,
  ): Promise<GroupInvitation> {
    return this.mirrorInvitation(
      await this.remote.rejectInvitation(invitationId, updatedAt),
    );
  }

  async cancelInvitation(
    invitationId: string,
    updatedAt: string,
  ): Promise<GroupInvitation> {
    return this.mirrorInvitation(
      await this.remote.cancelInvitation(invitationId, updatedAt),
    );
  }

  async createGroupJoinRequest(
    input: CreateGroupJoinRequestInput,
  ): Promise<GroupJoinRequest> {
    return this.remote.createGroupJoinRequest(input);
  }

  async respondToGroupJoinRequest(
    input: RespondToGroupJoinRequestInput,
  ): Promise<{ group: Group; request: GroupJoinRequest }> {
    const result = await this.remote.respondToGroupJoinRequest(input);
    await this.mirrorGroup(result.group);
    return result;
  }

  async ensureGroupJoinCode(input: EnsureGroupJoinCodeInput): Promise<Group> {
    return this.mirrorGroup(await this.remote.ensureGroupJoinCode(input));
  }

  protected async mirrorGroup(group: Group): Promise<Group> {
    const ownerId = readCurrentOwnerId();
    if (ownerId) {
      await this.bestEffort(() =>
        cacheGroup(ownerId, group, new Date().toISOString()),
      );
    }
    return group;
  }

  protected async mirrorInvitation(
    invitation: GroupInvitation,
  ): Promise<GroupInvitation> {
    const ownerId = readCurrentOwnerId();
    if (ownerId) {
      await this.bestEffort(() =>
        cacheGroupInvitation(ownerId, invitation, new Date().toISOString()),
      );
    }
    return invitation;
  }

  protected async cacheInvitationList(
    groupId: string,
    invitations: readonly GroupInvitation[],
  ): Promise<void> {
    const ownerId = readCurrentOwnerId();
    if (!ownerId) return;

    await this.bestEffort(() =>
      cacheGroupInvitations(
        ownerId,
        groupId,
        invitations,
        new Date().toISOString(),
      ),
    );
  }

  protected async bestEffort(work: () => Promise<void>): Promise<void> {
    try {
      await work();
    } catch {
      // The online operation already succeeded.
    }
  }
}
