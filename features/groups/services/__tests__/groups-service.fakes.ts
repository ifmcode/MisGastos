import { createFriendPairId } from "@/features/friends/utils/friend-pair";

import type { IGroupNotificationPort } from "../../repositories/group-notification.port";
import type { GroupInviteNotificationInput } from "../../repositories/group-notification.port";
import type { IGroupsRepository } from "../../repositories/groups.repository";
import type {
  CreateGroupWithInvitationsInput,
  CreateGroupWithInvitationsResult,
  Group,
  GroupInvitation,
  GroupMetadataUpdate,
  InviteMembersInput,
} from "../../types/group.types";
import { createGroupInvitationId } from "../../utils/group-ids";

const NOW = "2026-11-20T10:00:00.000Z";

export class FakeGroupsRepository implements IGroupsRepository {
  readonly groups = new Map<string, Group>();
  readonly invitations = new Map<string, GroupInvitation>();
  readonly createInputs: CreateGroupWithInvitationsInput[] = [];
  readonly inviteInputs: InviteMembersInput[] = [];
  readonly updateInputs: Array<{ groupId: string; update: GroupMetadataUpdate }> =
    [];
  readonly removedMembers: Array<{ groupId: string; memberId: string }> = [];
  readonly accepted: Array<{ viewerUid: string; invitationId: string }> = [];
  readonly invitedCalls: string[] = [];
  /** Group ids whose read must fail with permission-denied. */
  readonly denied: string[] = [];
  failure: Error | null = null;
  private nextGroupId = 1;

  seedGroup(overrides: Partial<Group> = {}): Group {
    const ownerId = overrides.ownerId ?? "user-a";
    const id = overrides.id ?? `${ownerId}__group-${this.nextGroupId}`;
    if (!overrides.id) this.nextGroupId += 1;

    const group: Group = {
      id,
      ownerId,
      memberIds: [ownerId],
      name: "Viaje",
      description: null,
      defaultCurrency: "EUR",
      createdAt: NOW,
      updatedAt: NOW,
      ...overrides,
    };
    this.groups.set(id, group);

    return group;
  }

  seedInvitation(overrides: Partial<GroupInvitation> = {}): GroupInvitation {
    const inviterId = overrides.inviterId ?? "user-a";
    const groupId = overrides.groupId ?? `${inviterId}__group-1`;
    const inviteeId = overrides.inviteeId ?? "user-b";
    const invitation: GroupInvitation = {
      id: createGroupInvitationId(groupId, inviteeId),
      groupId,
      groupName: "Viaje",
      inviterId,
      inviteeId,
      pairId: createFriendPairId(inviterId, inviteeId),
      status: "pending",
      createdAt: NOW,
      updatedAt: NOW,
      ...overrides,
    };
    this.invitations.set(invitation.id, invitation);

    return invitation;
  }

  private guard(): void {
    if (this.failure) throw this.failure;
  }

  async createGroupWithInvitations(
    input: CreateGroupWithInvitationsInput,
  ): Promise<CreateGroupWithInvitationsResult> {
    this.guard();
    this.createInputs.push(input);

    const group = this.seedGroup({
      id: `${input.ownerId}__group-${this.nextGroupId++}`,
      ownerId: input.ownerId,
      memberIds: [input.ownerId],
      name: input.name,
      description: input.description,
      defaultCurrency: input.defaultCurrency,
      createdAt: input.createdAt,
      updatedAt: input.createdAt,
    });
    const invitations = input.inviteeIds.map((inviteeId) =>
      this.seedInvitation({
        groupId: group.id,
        groupName: group.name,
        inviterId: group.ownerId,
        inviteeId,
        createdAt: input.createdAt,
        updatedAt: input.createdAt,
      }),
    );

    return { group, invitations };
  }

  async getGroups(memberId: string): Promise<Group[]> {
    this.guard();

    return [...this.groups.values()].filter((group) =>
      group.memberIds.includes(memberId),
    );
  }

  async getGroup(groupId: string): Promise<Group | null> {
    this.guard();
    if (this.denied.includes(groupId)) {
      const error = new Error("Missing or insufficient permissions");
      Object.assign(error, { code: "permission-denied" });
      throw error;
    }

    return this.groups.get(groupId) ?? null;
  }

  async updateGroup(
    groupId: string,
    update: GroupMetadataUpdate,
  ): Promise<Group> {
    this.guard();
    this.updateInputs.push({ groupId, update });

    const group = this.groups.get(groupId);
    if (!group) throw new Error("group not found");

    const updated = { ...group, ...update };
    this.groups.set(groupId, updated);

    return updated;
  }

  async removeMember(
    groupId: string,
    memberId: string,
    updatedAt: string,
  ): Promise<Group> {
    this.guard();
    this.removedMembers.push({ groupId, memberId });

    const group = this.groups.get(groupId);
    if (!group) throw new Error("group not found");

    const memberIds = group.memberIds.filter((uid) => uid !== memberId);
    const updated = { ...group, memberIds, updatedAt };
    this.groups.set(groupId, updated);

    return updated;
  }

  async getGroupInvitation(
    invitationId: string,
  ): Promise<GroupInvitation | null> {
    this.guard();

    return this.invitations.get(invitationId) ?? null;
  }

  async getGroupInvitations(
    inviterId: string,
    groupId: string,
  ): Promise<GroupInvitation[]> {
    this.guard();

    return [...this.invitations.values()].filter(
      (item) => item.inviterId === inviterId && item.groupId === groupId,
    );
  }

  async getPendingInvitations(
    inviteeId: string,
  ): Promise<GroupInvitation[]> {
    this.guard();

    return [...this.invitations.values()]
      .filter((item) => item.inviteeId === inviteeId)
      .filter((item) => item.status === "pending")
      .sort((left, right) => (left.createdAt < right.createdAt ? 1 : -1));
  }

  async inviteMembers(input: InviteMembersInput): Promise<GroupInvitation[]> {
    this.guard();
    this.inviteInputs.push(input);

    const results: GroupInvitation[] = [];

    for (const inviteeId of input.inviteeIds) {
      const id = createGroupInvitationId(input.groupId, inviteeId);
      const current = this.invitations.get(id);

      if (current) {
        if (current.status === "pending") {
          results.push(current);
          continue;
        }

        const reopened = {
          ...current,
          groupName: input.groupName,
          status: "pending" as const,
          updatedAt: input.updatedAt,
        };
        this.invitations.set(id, reopened);
        results.push(reopened);
        continue;
      }

      const created: GroupInvitation = {
        id,
        groupId: input.groupId,
        groupName: input.groupName,
        inviterId: input.inviterId,
        inviteeId,
        pairId: "user-a__user-b",
        status: "pending",
        createdAt: input.updatedAt,
        updatedAt: input.updatedAt,
      };
      this.invitations.set(id, created);
      results.push(created);
    }

    return results;
  }

  async acceptInvitation(
    viewerUid: string,
    invitationId: string,
  ): Promise<Group> {
    this.guard();
    this.accepted.push({ viewerUid, invitationId });

    const invitation = this.invitations.get(invitationId);
    if (!invitation) throw new Error("invitation not found");

    const group = this.groups.get(invitation.groupId);
    if (!group) throw new Error("group not found");

    this.invitations.set(invitationId, {
      ...invitation,
      status: "accepted",
      updatedAt: NOW,
    });
    const updated = {
      ...group,
      memberIds: [...group.memberIds, viewerUid],
      updatedAt: NOW,
    };
    this.groups.set(group.id, updated);

    return updated;
  }

  async rejectInvitation(
    invitationId: string,
    updatedAt: string,
  ): Promise<GroupInvitation> {
    return this.transition(invitationId, "rejected", updatedAt);
  }

  async cancelInvitation(
    invitationId: string,
    updatedAt: string,
  ): Promise<GroupInvitation> {
    return this.transition(invitationId, "cancelled", updatedAt);
  }

  private transition(
    invitationId: string,
    status: GroupInvitation["status"],
    updatedAt: string,
  ): GroupInvitation {
    this.guard();
    this.invitedCalls.push(`${status}:${invitationId}`);

    const invitation = this.invitations.get(invitationId);
    if (!invitation) throw new Error("invitation not found");

    const updated = { ...invitation, status, updatedAt };
    this.invitations.set(invitationId, updated);

    return updated;
  }
}

export class FakeGroupNotificationPort implements IGroupNotificationPort {
  readonly sent: GroupInviteNotificationInput[] = [];
  failure: Error | null = null;

  async notifyGroupInvite(input: GroupInviteNotificationInput): Promise<void> {
    this.sent.push(input);
    if (this.failure) throw this.failure;
  }
}
