import type { Group, GroupInvitation } from "../types/group.types";

/** Name ascending, then id ascending: the list order never jumps around. */
export function compareGroups(left: Group, right: Group): number {
  if (left.name !== right.name) return left.name < right.name ? -1 : 1;
  if (left.id === right.id) return 0;

  return left.id < right.id ? -1 : 1;
}

export function sortGroups(groups: readonly Group[]): Group[] {
  return [...groups].sort(compareGroups);
}

/** Newest first, then id ascending. */
export function compareInvitationsNewestFirst(
  left: GroupInvitation,
  right: GroupInvitation,
): number {
  if (left.createdAt !== right.createdAt) {
    return left.createdAt < right.createdAt ? 1 : -1;
  }
  if (left.id === right.id) return 0;

  return left.id < right.id ? -1 : 1;
}

export function filterPendingInvitations(
  invitations: readonly GroupInvitation[],
): GroupInvitation[] {
  return invitations.filter((invitation) => invitation.status === "pending");
}

export function sortInvitationsNewestFirst(
  invitations: readonly GroupInvitation[],
): GroupInvitation[] {
  return [...invitations].sort(compareInvitationsNewestFirst);
}

/** Pending rows of one group, newest first; the detail screen order. */
export function getGroupPendingInvitations(
  invitations: readonly GroupInvitation[],
  groupId: string,
): GroupInvitation[] {
  const group = groupId.trim();

  return sortInvitationsNewestFirst(
    filterPendingInvitations(invitations).filter(
      (invitation) => invitation.groupId === group,
    ),
  );
}

export function countPendingInvitations(
  invitations: readonly GroupInvitation[],
): number {
  return filterPendingInvitations(invitations).length;
}

/** Owner included, so the list can show "3 miembros" without a second read. */
export function getGroupMemberCount(group: Group): number {
  return group.memberIds.length;
}
