import type { IFriendsRepository } from "@/features/friends/repositories/friends.repository";

import type { IGroupNotificationPort } from "../repositories/group-notification.port";
import type { IGroupsRepository } from "../repositories/groups.repository";
import type {
  Group,
  GroupDetail,
  GroupInput,
  GroupInvitation,
  GroupInvitationItem,
  GroupUpdateInput,
  PendingGroupInvitationItem,
} from "../types/group.types";
import { createGroupWithFriends } from "./group-create";
import type { GroupWriteDeps } from "./group-deps";
import { assertGroupMember, requireGroupViewer } from "./group-guards";
import {
  loadGroupDetailFor,
  loadGroups,
  loadOwnedGroupInvitations,
  loadReceivedPendingInvitations,
  loadVisibleGroup,
} from "./group-read";
import { validateGroupOrThrow } from "./group-validation";
import {
  acceptGroupInvitation,
  cancelGroupInvitation,
  inviteGroupMembers,
  rejectGroupInvitation,
  removeGroupMemberRecord,
  updateGroupRecord,
} from "./group-write";

/** Groups use cases; guards, validation and persistence live in helpers. */
export class GroupsService {
  private readonly writeDeps: GroupWriteDeps;

  constructor(
    repository: IGroupsRepository,
    friendsRepository: IFriendsRepository,
    notifications: IGroupNotificationPort,
  ) {
    this.writeDeps = { repository, friendsRepository, notifications };
  }

  async getGroups(viewerUid: string): Promise<Group[]> {
    return loadGroups(this.writeDeps.repository, requireGroupViewer(viewerUid));
  }

  /** Member-only; a denied or missing read is the UI's safe missing state. */
  async getGroup(viewerUid: string, groupId: string): Promise<Group | null> {
    const viewer = requireGroupViewer(viewerUid);
    const group = await loadVisibleGroup(this.writeDeps.repository, groupId);
    if (!group) return null;
    assertGroupMember(group, viewer);

    return group;
  }

  async getGroupDetail(viewerUid: string, groupId: string): Promise<GroupDetail> {
    const viewer = requireGroupViewer(viewerUid);
    return loadGroupDetailFor(this.writeDeps, viewer, groupId);
  }

  async createGroup(viewerUid: string, input: GroupInput): Promise<Group> {
    const viewer = requireGroupViewer(viewerUid);

    return createGroupWithFriends(
      this.writeDeps,
      viewer,
      validateGroupOrThrow(input, viewer),
    );
  }

  async updateGroup(
    viewerUid: string,
    groupId: string,
    input: GroupUpdateInput,
  ): Promise<Group> {
    const viewer = requireGroupViewer(viewerUid);
    return updateGroupRecord(this.writeDeps.repository, viewer, groupId, input);
  }

  async removeMember(
    viewerUid: string,
    groupId: string,
    memberId: string,
  ): Promise<Group> {
    const viewer = requireGroupViewer(viewerUid);
    const repository = this.writeDeps.repository;

    return removeGroupMemberRecord(repository, viewer, groupId, memberId);
  }

  async inviteMembers(
    viewerUid: string,
    groupId: string,
    inviteeIds: readonly string[],
  ): Promise<GroupInvitation[]> {
    const viewer = requireGroupViewer(viewerUid);
    return inviteGroupMembers(this.writeDeps, viewer, groupId, inviteeIds);
  }

  async acceptInvitation(viewerUid: string, invitationId: string): Promise<Group> {
    const viewer = requireGroupViewer(viewerUid);

    return acceptGroupInvitation(this.writeDeps, viewer, invitationId);
  }

  async rejectInvitation(
    viewerUid: string,
    invitationId: string,
  ): Promise<GroupInvitation> {
    const viewer = requireGroupViewer(viewerUid);
    return rejectGroupInvitation(
      this.writeDeps.repository,
      viewer,
      invitationId,
    );
  }

  async cancelInvitation(
    viewerUid: string,
    invitationId: string,
  ): Promise<GroupInvitation> {
    const viewer = requireGroupViewer(viewerUid);
    return cancelGroupInvitation(
      this.writeDeps.repository,
      viewer,
      invitationId,
    );
  }

  async getPendingInvitations(
    viewerUid: string,
  ): Promise<PendingGroupInvitationItem[]> {
    const viewer = requireGroupViewer(viewerUid);
    return loadReceivedPendingInvitations(this.writeDeps, viewer);
  }

  async getGroupInvitations(
    viewerUid: string,
    groupId: string,
  ): Promise<GroupInvitationItem[]> {
    const viewer = requireGroupViewer(viewerUid);
    return loadOwnedGroupInvitations(this.writeDeps, viewer, groupId);
  }
}
