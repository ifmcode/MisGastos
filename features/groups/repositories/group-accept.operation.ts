import { runTransaction } from "firebase/firestore";

import { db } from "@/lib/firebase";

import { GroupOperationError } from "../services/group.errors";
import type { Group } from "../types/group.types";
import {
  appendGroupMember,
  isGroupFull,
} from "../utils/group-membership";
import {
  mapGroupDocument,
  mapGroupInvitationDocument,
} from "./groups.mapper";
import { groupInvitationRef, groupRef } from "./groups.operations";

/**
 * Membership only grows through acceptance: the invitation becomes `accepted`
 * and the caller is appended to the owner-first member list in one
 * `runTransaction`. The rules re-check the invitation with `getAfter`, so a
 * group update without its accepted invitation is impossible.
 */
export async function acceptGroupInvitationOperation(
  viewerUid: string,
  invitationId: string,
): Promise<Group> {
  const updatedAt = new Date().toISOString();
  let group: Group | null = null;

  await runTransaction(db, async (transaction) => {
    const invitationSnapshot = await transaction.get(
      groupInvitationRef(invitationId),
    );
    if (!invitationSnapshot.exists()) {
      throw new GroupOperationError("INVITATION_NOT_FOUND");
    }

    const invitation = mapGroupInvitationDocument(
      invitationSnapshot.id,
      invitationSnapshot.data() as Record<string, unknown>,
    );
    if (!invitation) throw new GroupOperationError("INVITATION_NOT_FOUND");
    if (invitation.inviteeId !== viewerUid) {
      throw new GroupOperationError("NOT_INVITEE");
    }
    if (invitation.status !== "pending") {
      throw new GroupOperationError("INVITATION_NOT_PENDING");
    }

    const groupSnapshot = await transaction.get(groupRef(invitation.groupId));
    if (!groupSnapshot.exists()) {
      throw new GroupOperationError("GROUP_NOT_FOUND");
    }

    const current = mapGroupDocument(
      groupSnapshot.id,
      groupSnapshot.data() as Record<string, unknown>,
    );
    if (!current) throw new GroupOperationError("GROUP_NOT_FOUND");
    if (current.memberIds.includes(viewerUid)) {
      throw new GroupOperationError("ALREADY_MEMBER");
    }
    if (isGroupFull(current.memberIds)) {
      throw new GroupOperationError("GROUP_FULL");
    }

    const memberIds = appendGroupMember(current.memberIds, viewerUid);

    transaction.update(groupInvitationRef(invitation.id), {
      status: "accepted",
      updatedAt,
    });
    transaction.update(groupRef(current.id), { memberIds, updatedAt });

    group = { ...current, memberIds, updatedAt };
  });

  if (!group) throw new GroupOperationError("GROUP_NOT_FOUND");

  return group;
}
