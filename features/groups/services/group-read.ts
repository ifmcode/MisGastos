import type {
  Group,
  GroupDetail,
  GroupInvitationItem,
  PendingGroupInvitationItem,
} from "../types/group.types";
import { sortGroups } from "../utils/group-list";
import type { GroupReadDeps } from "./group-deps";
import {
  loadGroupDetail,
  loadGroupInvitationItems,
  loadReceivedInvitations,
} from "./group-detail";
import { GroupOperationError, getGroupErrorCode } from "./group.errors";
import {
  assertGroupMember,
  assertGroupOwner,
  requireGroup,
} from "./group-guards";

export async function loadGroups(
  repository: GroupReadDeps["repository"],
  viewerUid: string,
): Promise<Group[]> {
  const groups = await repository.getGroups(viewerUid);

  return sortGroups(groups);
}

/**
 * Member-only single read. The rules deny reads of missing documents too, so a
 * denied read resolves to the same safe `null` the missing state needs; the
 * repository keeps the raw error and never hides it.
 */
export async function loadVisibleGroup(
  repository: GroupReadDeps["repository"],
  groupId: string,
): Promise<Group | null> {
  const id = typeof groupId === "string" ? groupId.trim() : "";
  if (id.length === 0) return null;

  try {
    return await repository.getGroup(id);
  } catch (error) {
    if (getGroupErrorCode(error) === "PERMISSION_DENIED") return null;

    throw error;
  }
}

export async function loadGroupDetailFor(
  { repository, friendsRepository }: GroupReadDeps,
  viewerUid: string,
  groupId: string,
): Promise<GroupDetail> {
  const group = await loadVisibleGroup(repository, groupId);
  if (!group) throw new GroupOperationError("GROUP_NOT_FOUND");

  assertGroupMember(group, viewerUid);

  return loadGroupDetail(repository, friendsRepository, group, viewerUid);
}

export async function loadReceivedPendingInvitations(
  { repository, friendsRepository }: GroupReadDeps,
  viewerUid: string,
): Promise<PendingGroupInvitationItem[]> {
  const invitations = await repository.getPendingInvitations(viewerUid);

  return loadReceivedInvitations(friendsRepository, invitations);
}

export async function loadOwnedGroupInvitations(
  { repository, friendsRepository }: GroupReadDeps,
  viewerUid: string,
  groupId: string,
): Promise<GroupInvitationItem[]> {
  const group = await requireGroup(repository, groupId);
  assertGroupOwner(group, viewerUid);

  return loadGroupInvitationItems(repository, friendsRepository, group);
}
