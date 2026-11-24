import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";

import { db } from "@/lib/firebase";

import type { Group, GroupInvitation } from "../types/group.types";
import {
  filterPendingInvitations,
  sortInvitationsNewestFirst,
} from "../utils/group-list";
import {
  GROUP_CODES_COLLECTION,
  GROUP_INVITATIONS_COLLECTION,
  GROUP_JOIN_REQUESTS_COLLECTION,
  GROUPS_COLLECTION,
} from "./groups.data";
import {
  mapGroupDocument,
  mapGroupInvitationDocument,
} from "./groups.mapper";

export function groupRef(groupId: string) {
  return doc(db, GROUPS_COLLECTION, groupId);
}

export function groupCodeRef(code: string) {
  return doc(db, GROUP_CODES_COLLECTION, code);
}

export function groupJoinRequestRef(requestId: string) {
  return doc(db, GROUP_JOIN_REQUESTS_COLLECTION, requestId);
}

export function groupInvitationRef(invitationId: string) {
  return doc(db, GROUP_INVITATIONS_COLLECTION, invitationId);
}

export async function getGroupOperation(
  groupId: string,
): Promise<Group | null> {
  const snapshot = await getDoc(groupRef(groupId));
  if (!snapshot.exists()) return null;

  return mapGroupDocument(
    snapshot.id,
    snapshot.data() as Record<string, unknown>,
  );
}

/** `array-contains` on the owner-first member list; no composite index. */
export async function getGroupsOperation(
  memberId: string,
): Promise<Group[]> {
  const snapshot = await getDocs(
    query(
      collection(db, GROUPS_COLLECTION),
      where("memberIds", "array-contains", memberId),
    ),
  );

  const groups: Group[] = [];

  for (const document of snapshot.docs) {
    const group = mapGroupDocument(
      document.id,
      document.data() as Record<string, unknown>,
    );
    if (group) groups.push(group);
  }

  return groups;
}

export async function getGroupInvitationOperation(
  invitationId: string,
): Promise<GroupInvitation | null> {
  const snapshot = await getDoc(groupInvitationRef(invitationId));
  if (!snapshot.exists()) return null;

  return mapGroupInvitationDocument(
    snapshot.id,
    snapshot.data() as Record<string, unknown>,
  );
}

/**
 * Every invitation of one group, regardless of who opened it. The query uses
 * the single-field `groupId` index (no composite index) so a promoted owner
 * sees the pending invitations created before the transfer; the rules let the
 * current owner `list` them.
 */
export async function getGroupInvitationsOperation(
  groupId: string,
): Promise<GroupInvitation[]> {
  const snapshot = await getDocs(
    query(
      collection(db, GROUP_INVITATIONS_COLLECTION),
      where("groupId", "==", groupId),
    ),
  );

  const invitations: GroupInvitation[] = [];

  for (const document of snapshot.docs) {
    const invitation = mapGroupInvitationDocument(
      document.id,
      document.data() as Record<string, unknown>,
    );
    if (invitation) invitations.push(invitation);
  }

  return invitations;
}

/** Received invitations, pending only, newest first; no composite index. */
export async function getPendingInvitationsOperation(
  inviteeId: string,
): Promise<GroupInvitation[]> {
  const snapshot = await getDocs(
    query(
      collection(db, GROUP_INVITATIONS_COLLECTION),
      where("inviteeId", "==", inviteeId),
    ),
  );

  const invitations: GroupInvitation[] = [];

  for (const document of snapshot.docs) {
    const invitation = mapGroupInvitationDocument(
      document.id,
      document.data() as Record<string, unknown>,
    );
    if (invitation) invitations.push(invitation);
  }

  return sortInvitationsNewestFirst(filterPendingInvitations(invitations));
}

