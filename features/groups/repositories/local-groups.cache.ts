import {
  cacheSocialRow,
  cacheSocialRows,
  readCachedSocialRows,
} from "@/shared/lib/local-db/social-cache";
import type { LocalRow } from "@/shared/lib/local-db/local-db.types";

import type { Group, GroupInvitation } from "../types/group.types";
import {
  fromGroupInvitationLocalRow,
  fromGroupLocalRow,
  toGroupInvitationLocalRow,
  toGroupLocalRow,
} from "./local-groups.mapper";

const GROUPS = "groups" as const;
const INVITATIONS = "groupInvitations" as const;

function invitationsKey(groupId: string): string {
  return `groupInvitations:${groupId}`;
}

export async function readCachedGroups(
  ownerId: string,
): Promise<Group[] | null> {
  const rows = await readCachedSocialRows({
    table: GROUPS,
    ownerId,
    collection: GROUPS,
  });
  if (rows === null) return null;

  return rows.flatMap((row) => {
    const group = fromGroupLocalRow(row);
    return group ? [group] : [];
  });
}

export async function readCachedGroup(
  ownerId: string,
  groupId: string,
): Promise<Group | null> {
  const groups = await readCachedGroups(ownerId);
  return groups?.find((group) => group.id === groupId) ?? null;
}

export async function cacheGroups(
  ownerId: string,
  groups: readonly Group[],
  now: string,
): Promise<void> {
  await cacheSocialRows({
    table: GROUPS,
    ownerId,
    collection: GROUPS,
    rows: groups.map((group) => toGroupLocalRow(group, ownerId)),
    now,
  });
}

export async function cacheGroup(
  ownerId: string,
  group: Group,
  now: string,
): Promise<void> {
  await cacheSocialRow(
    GROUPS,
    ownerId,
    toGroupLocalRow(group, ownerId),
    now,
  );
}

export async function readCachedGroupInvitations(
  ownerId: string,
  groupId: string,
): Promise<GroupInvitation[] | null> {
  const rows = await readCachedSocialRows({
    table: INVITATIONS,
    ownerId,
    collection: invitationsKey(groupId),
    scope: { groupId },
  });
  return toInvitations(rows);
}

export async function readCachedPendingInvitations(
  ownerId: string,
  inviteeId: string,
): Promise<GroupInvitation[] | null> {
  const rows = await readCachedSocialRows({
    table: INVITATIONS,
    ownerId,
    collection: `groupInvitations:pending:${inviteeId}`,
  });
  const invitations = toInvitations(rows);
  if (invitations === null) return null;

  return invitations.filter(
    (invitation) =>
      invitation.inviteeId === inviteeId && invitation.status === "pending",
  );
}

export async function cacheGroupInvitations(
  ownerId: string,
  groupId: string,
  invitations: readonly GroupInvitation[],
  now: string,
): Promise<void> {
  await cacheSocialRows({
    table: INVITATIONS,
    ownerId,
    collection: invitationsKey(groupId),
    scope: { groupId },
    rows: invitations.map((invitation) =>
      toGroupInvitationLocalRow(invitation, ownerId),
    ),
    now,
  });
}

export async function cachePendingInvitations(
  ownerId: string,
  inviteeId: string,
  invitations: readonly GroupInvitation[],
  now: string,
): Promise<void> {
  await cacheSocialRows({
    table: INVITATIONS,
    ownerId,
    collection: `groupInvitations:pending:${inviteeId}`,
    scope: { inviteeId },
    rows: invitations.map((invitation) =>
      toGroupInvitationLocalRow(invitation, ownerId),
    ),
    now,
  });
}

export async function cacheGroupInvitation(
  ownerId: string,
  invitation: GroupInvitation,
  now: string,
): Promise<void> {
  await cacheSocialRow(
    INVITATIONS,
    ownerId,
    toGroupInvitationLocalRow(invitation, ownerId),
    now,
  );
}

function toInvitations(
  rows: readonly LocalRow[] | null,
): GroupInvitation[] | null {
  if (rows === null) return null;

  return rows.flatMap((row) => {
    const invitation = fromGroupInvitationLocalRow(row);
    return invitation ? [invitation] : [];
  });
}
