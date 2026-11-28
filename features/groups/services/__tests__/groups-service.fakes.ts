import { createFriendPairId } from "@/features/friends/utils/friend-pair";

import type { IGroupNotificationPort } from "../../repositories/group-notification.port";
import type {
  GroupJoinOutcomeNotificationInput,
  GroupSettlementNotificationInput,
} from "../../repositories/group-notification.port";
import type { IGroupsRepository } from "../../repositories/groups.repository";
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
} from "../../types/group.types";
import type {
  GroupMemberNet,
  IGroupBalancePort,
} from "../../services/group-balance.port";
import type {
  GroupActivity,
  GroupActivityPage,
  GroupActivityQuery,
} from "../../types/group-activity.types";
import type {
  CreateGroupJoinRequestInput,
  EnsureGroupJoinCodeInput,
  GroupCode,
  GroupJoinRequest,
  RespondToGroupJoinRequestInput,
} from "../../types/group-join.types";
import { createGroupInvitationId } from "../../utils/group-ids";
import { createGroupJoinRequestId } from "../../utils/group-join-code";
import { sortJoinRequestsOldestFirst } from "../../utils/group-join-request";

const NOW = "2026-11-20T10:00:00.000Z";

export class FakeGroupsRepository implements IGroupsRepository {
  readonly groups = new Map<string, Group>();
  readonly invitations = new Map<string, GroupInvitation>();
  readonly codes = new Map<string, GroupCode>();
  readonly joinRequests = new Map<string, GroupJoinRequest>();
  readonly createInputs: CreateGroupWithInvitationsInput[] = [];
  readonly inviteInputs: InviteMembersInput[] = [];
  readonly updateInputs: Array<{
    viewerUid: string;
    groupId: string;
    update: GroupMetadataUpdate;
  }> = [];
  readonly removedMembers: Array<{ groupId: string; memberId: string }> = [];
  readonly removedInputs: RemoveGroupMemberInput[] = [];
  readonly leftGroups: Array<{ groupId: string; memberId: string }> = [];
  readonly leaveInputs: LeaveGroupInput[] = [];
  readonly transfers: TransferGroupOwnershipInput[] = [];
  readonly activityQueries: Array<{
    groupId: string;
    query: GroupActivityQuery | undefined;
  }> = [];
  readonly accepted: Array<{ viewerUid: string; invitationId: string }> = [];
  readonly invitedCalls: string[] = [];
  readonly joinRequestInputs: CreateGroupJoinRequestInput[] = [];
  readonly respondInputs: RespondToGroupJoinRequestInput[] = [];
  readonly ensureInputs: EnsureGroupJoinCodeInput[] = [];
  /** Group ids whose read must fail with permission-denied. */
  readonly denied: string[] = [];
  /** Seeded history per group, newest first. */
  readonly activity = new Map<string, GroupActivity[]>();
  failure: Error | null = null;
  private nextGroupId = 1;

  seedGroup(overrides: Partial<Group> = {}): Group {
    const ownerId = overrides.ownerId ?? "user-a";
    const id = overrides.id ?? `${ownerId}__group-${this.nextGroupId}`;
    if (!overrides.id) this.nextGroupId += 1;

    const group: Group = {
      id,
      ownerId,
      createdBy: overrides.createdBy ?? ownerId,
      memberIds: [ownerId],
      name: "Viaje",
      description: null,
      defaultCurrency: "EUR",
      joinCode: "ABCD2345",
      simplifyDebts: true,
      createdAt: NOW,
      updatedAt: NOW,
      ...overrides,
    };
    this.groups.set(id, group);

    return group;
  }

  /** Seeds the code projection that resolves to one group. */
  seedCode(group: Group, code = group.joinCode ?? "ABCD2345"): GroupCode {
    const projection: GroupCode = {
      code,
      groupId: group.id,
      ownerId: group.ownerId,
      groupName: group.name,
    };
    this.codes.set(code, projection);

    return projection;
  }

  seedJoinRequest(overrides: Partial<GroupJoinRequest> = {}): GroupJoinRequest {
    const groupId = overrides.groupId ?? "user-a__group-1";
    const requesterId = overrides.requesterId ?? "user-b";
    const request: GroupJoinRequest = {
      id: createGroupJoinRequestId(groupId, requesterId),
      groupId,
      requesterId,
      joinCode: "ABCD2345",
      status: "pending",
      createdAt: NOW,
      updatedAt: NOW,
      ...overrides,
    };
    this.joinRequests.set(request.id, request);

    return request;
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
    viewerUid: string,
    groupId: string,
    update: GroupMetadataUpdate,
  ): Promise<Group> {
    this.guard();
    this.updateInputs.push({ viewerUid, groupId, update });

    const group = this.groups.get(groupId);
    if (!group) throw new Error("group not found");

    const updated = { ...group, ...update };
    this.groups.set(groupId, updated);

    return updated;
  }

  async removeMember(input: RemoveGroupMemberInput): Promise<Group> {
    this.guard();
    this.removedMembers.push({
      groupId: input.groupId,
      memberId: input.memberId,
    });
    this.removedInputs.push(input);

    const group = this.groups.get(input.groupId);
    if (!group) throw new Error("group not found");

    const memberIds = group.memberIds.filter((uid) => uid !== input.memberId);
    const updated = { ...group, memberIds, updatedAt: input.updatedAt };
    this.groups.set(input.groupId, updated);

    return updated;
  }

  async getGroupActivity(
    groupId: string,
    query?: GroupActivityQuery,
  ): Promise<GroupActivityPage> {
    this.guard();
    this.activityQueries.push({ groupId, query });

    const items = this.activity.get(groupId) ?? [];
    const limit = query?.limit ?? 20;
    const page = items.slice(0, limit);
    const hasMore = items.length > limit;
    const last = page[page.length - 1];

    return {
      items: page,
      hasMore,
      nextCursor: hasMore && last ? { createdAt: last.createdAt, id: last.id } : null,
    };
  }

  async leaveGroup(input: LeaveGroupInput): Promise<Group> {
    this.guard();
    this.leftGroups.push({ groupId: input.groupId, memberId: input.memberId });
    this.leaveInputs.push(input);

    const group = this.groups.get(input.groupId);
    if (!group) throw new Error("group not found");

    const memberIds = group.memberIds.filter((uid) => uid !== input.memberId);
    const updated = { ...group, memberIds, updatedAt: input.updatedAt };
    this.groups.set(input.groupId, updated);

    return updated;
  }

  async transferOwnership(
    input: TransferGroupOwnershipInput,
  ): Promise<Group> {
    this.guard();
    this.transfers.push(input);

    const group = this.groups.get(input.groupId);
    if (!group) throw new Error("group not found");

    const memberIds = [
      input.newOwnerId,
      ...group.memberIds.filter((uid) => uid !== input.newOwnerId),
    ];
    const updated = {
      ...group,
      ownerId: input.newOwnerId,
      memberIds,
      updatedAt: input.updatedAt,
    };
    this.groups.set(input.groupId, updated);

    return updated;
  }

  async getGroupInvitation(
    invitationId: string,
  ): Promise<GroupInvitation | null> {
    this.guard();

    return this.invitations.get(invitationId) ?? null;
  }

  async getGroupInvitations(groupId: string): Promise<GroupInvitation[]> {
    this.guard();

    return [...this.invitations.values()].filter(
      (item) => item.groupId === groupId,
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

  async getGroupCode(code: string): Promise<GroupCode | null> {
    this.guard();

    return this.codes.get(code) ?? null;
  }

  async getGroupJoinRequest(
    requestId: string,
  ): Promise<GroupJoinRequest | null> {
    this.guard();

    return this.joinRequests.get(requestId) ?? null;
  }

  async getGroupJoinRequests(groupId: string): Promise<GroupJoinRequest[]> {
    this.guard();

    return sortJoinRequestsOldestFirst(
      [...this.joinRequests.values()].filter(
        (request) => request.groupId === groupId,
      ),
    );
  }

  async createGroupJoinRequest(
    input: CreateGroupJoinRequestInput,
  ): Promise<GroupJoinRequest> {
    this.guard();
    this.joinRequestInputs.push(input);

    const id = createGroupJoinRequestId(input.groupId, input.requesterId);
    if (this.joinRequests.has(id)) {
      const error = new Error("Missing or insufficient permissions");
      Object.assign(error, { code: "permission-denied" });
      throw error;
    }

    const request: GroupJoinRequest = {
      id,
      groupId: input.groupId,
      requesterId: input.requesterId,
      joinCode: input.joinCode,
      status: "pending",
      createdAt: input.createdAt,
      updatedAt: input.createdAt,
    };
    this.joinRequests.set(id, request);

    return request;
  }

  async respondToGroupJoinRequest(
    input: RespondToGroupJoinRequestInput,
  ): Promise<{ group: Group; request: GroupJoinRequest }> {
    this.guard();
    this.respondInputs.push(input);

    const request = this.joinRequests.get(input.requestId);
    if (!request) throw new Error("request not found");
    const group = this.groups.get(input.groupId);
    if (!group) throw new Error("group not found");
    if (group.ownerId !== input.viewerUid) throw new Error("not owner");
    if (request.status !== "pending") throw new Error("not pending");

    const nextRequest: GroupJoinRequest = {
      ...request,
      status: input.decision,
      updatedAt: input.updatedAt,
    };
    this.joinRequests.set(request.id, nextRequest);

    if (input.decision === "rejected") {
      return { group, request: nextRequest };
    }

    const updated: Group = {
      ...group,
      memberIds: [...group.memberIds, request.requesterId],
      updatedAt: input.updatedAt,
    };
    this.groups.set(group.id, updated);

    return { group: updated, request: nextRequest };
  }

  async ensureGroupJoinCode(input: EnsureGroupJoinCodeInput): Promise<Group> {
    this.guard();
    this.ensureInputs.push(input);

    const group = this.groups.get(input.groupId);
    if (!group) throw new Error("group not found");
    if (group.joinCode) return group;

    const updated: Group = {
      ...group,
      joinCode: input.code,
      updatedAt: input.updatedAt,
    };
    this.groups.set(group.id, updated);
    this.codes.set(input.code, {
      code: input.code,
      groupId: group.id,
      ownerId: group.ownerId,
      groupName: group.name,
    });

    return updated;
  }
}

export class FakeGroupNotificationPort implements IGroupNotificationPort {
  readonly joinOutcomes: GroupJoinOutcomeNotificationInput[] = [];
  readonly settlements: GroupSettlementNotificationInput[] = [];
  failure: Error | null = null;

  async notifyJoinOutcome(
    input: GroupJoinOutcomeNotificationInput,
  ): Promise<void> {
    this.joinOutcomes.push(input);
    if (this.failure) throw this.failure;
  }

  async notifyGroupSettlement(
    input: GroupSettlementNotificationInput,
  ): Promise<void> {
    this.settlements.push(input);
    if (this.failure) throw this.failure;
  }
}

/** Ledger port fake: settled by default, per-member non-zero nets on demand. */
export class FakeGroupBalancePort implements IGroupBalancePort {
  readonly calls: Array<{ groupId: string; memberId: string }> = [];
  private readonly nets = new Map<string, GroupMemberNet[]>();
  failure: Error | null = null;

  setNets(groupId: string, memberId: string, nets: GroupMemberNet[]): void {
    this.nets.set(`${groupId}:${memberId}`, nets);
  }

  async getMemberNets(
    groupId: string,
    memberId: string,
  ): Promise<GroupMemberNet[]> {
    this.calls.push({ groupId, memberId });
    if (this.failure) throw this.failure;

    return this.nets.get(`${groupId}:${memberId}`) ?? [];
  }
}
