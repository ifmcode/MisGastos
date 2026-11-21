import type { IFriendsRepository } from "@/features/friends/repositories/friends.repository";

import type { IGroupsRepository } from "../repositories/groups.repository";
import type {
  Group,
  GroupDetail,
  GroupInvitation,
  GroupInvitationItem,
  GroupMember,
  PendingGroupInvitationItem,
} from "../types/group.types";
import type { GroupJoinRequestItem } from "../types/group-join.types";
import { getGroupPendingInvitations } from "../utils/group-list";
import {
  filterJoinRequestsOfNonMembers,
  filterPendingJoinRequests,
  sortJoinRequestsOldestFirst,
} from "../utils/group-join-request";
import { loadProfilesByUid } from "./group-friendship";

/** Group detail: the group, its resolved members and its pending invitations. */
export async function loadGroupDetail(
  repository: IGroupsRepository,
  friendsRepository: IFriendsRepository,
  group: Group,
  viewerUid: string,
): Promise<GroupDetail> {
  const profiles = await loadProfilesByUid(
    friendsRepository,
    group.memberIds,
  );
  const members: GroupMember[] = group.memberIds.map((uid) => {
    const profile = profiles.get(uid);

    return {
      uid,
      displayName: profile?.displayName ?? null,
      email: profile?.email ?? "",
      role: uid === group.ownerId ? "owner" : "member",
    };
  });

  // Pending invitations are owner-only: a member must not read other invitees.
  const invitations =
    group.ownerId === viewerUid
      ? await loadGroupInvitationItems(repository, friendsRepository, group)
      : [];
  // Join requests are owner-only too: `[]` for every other member.
  const joinRequests =
    group.ownerId === viewerUid
      ? await loadGroupJoinRequestItems(repository, friendsRepository, group)
      : [];

  return { group, members, invitations, joinRequests };
}

/** Pending invitations of one group; only the owner ever asks for them. */
export async function loadGroupInvitationItems(
  repository: IGroupsRepository,
  friendsRepository: IFriendsRepository,
  group: Group,
): Promise<GroupInvitationItem[]> {
  const invitations = getGroupPendingInvitations(
    await repository.getGroupInvitations(group.ownerId, group.id),
    group.id,
  );
  const profiles = await loadProfilesByUid(
    friendsRepository,
    invitations.map((invitation) => invitation.inviteeId),
  );

  return invitations.map((invitation) => ({
    invitation,
    invitee: profiles.get(invitation.inviteeId) ?? null,
  }));
}

/** Pending join requests of one group with the requester profile. */
export async function loadGroupJoinRequestItems(
  repository: IGroupsRepository,
  friendsRepository: IFriendsRepository,
  group: Group,
): Promise<GroupJoinRequestItem[]> {
  const requests = sortJoinRequestsOldestFirst(
    filterJoinRequestsOfNonMembers(
      filterPendingJoinRequests(
        await repository.getGroupJoinRequests(group.id),
      ),
      group.memberIds,
    ),
  );
  const profiles = await loadProfilesByUid(
    friendsRepository,
    requests.map((request) => request.requesterId),
  );

  return requests.map((request) => ({
    request,
    requester: profiles.get(request.requesterId) ?? null,
  }));
}

/** Received invitations with the inviter profile, newest first. */
export async function loadReceivedInvitations(
  friendsRepository: IFriendsRepository,
  invitations: readonly GroupInvitation[],
): Promise<PendingGroupInvitationItem[]> {
  const profiles = await loadProfilesByUid(
    friendsRepository,
    invitations.map((invitation) => invitation.inviterId),
  );

  return invitations.map((invitation) => ({
    invitationId: invitation.id,
    groupId: invitation.groupId,
    groupName: invitation.groupName,
    inviterId: invitation.inviterId,
    inviter: profiles.get(invitation.inviterId) ?? null,
    createdAt: invitation.createdAt,
  }));
}
