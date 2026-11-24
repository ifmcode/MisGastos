import { setDoc, updateDoc } from "firebase/firestore";

import { createFriendPairId } from "@/features/friends/utils/friend-pair";

import { GroupOperationError } from "../services/group.errors";
import type {
  GroupInvitation,
  GroupInvitationStatus,
  InviteMembersInput,
} from "../types/group.types";
import { createGroupInvitationId } from "../utils/group-ids";
import { normalizeGroupInviteeIds } from "../utils/group-membership";
import {
  toGroupInvitationData,
  toGroupInvitationRenameData,
  toGroupInvitationReopenData,
} from "./groups.data";
import {
  getGroupInvitationOperation,
  getGroupInvitationsOperation,
  groupInvitationRef,
} from "./groups.operations";

/**
 * Invites accepted friends that are not members. An existing pending document
 * is returned untouched, and a rejected/cancelled/accepted one is re-opened
 * instead of duplicated, because the id is deterministic. Re-opening after an
 * ownership transfer also rewrites `inviterId`/`pairId` to the current owner, so
 * the pending invitation and its friendship belong to whoever invites now.
 */
export async function inviteMembersOperation(
  input: InviteMembersInput,
): Promise<GroupInvitation[]> {
  const existing = await getGroupInvitationsOperation(input.groupId);
  const byInvitee = new Map(existing.map((item) => [item.inviteeId, item]));
  const results: GroupInvitation[] = [];

  for (const inviteeId of normalizeGroupInviteeIds(input.inviteeIds)) {
    const pairId = createFriendPairId(input.inviterId, inviteeId);
    if (pairId.length === 0) {
      throw new GroupOperationError("DUPLICATE_INVITEE");
    }

    const invitationId = createGroupInvitationId(input.groupId, inviteeId);
    const current = byInvitee.get(inviteeId);
    const reference = groupInvitationRef(invitationId);

    if (current) {
      if (current.status === "pending") {
        results.push(current);
        continue;
      }

      const inviterChanged = current.inviterId !== input.inviterId;
      await updateDoc(
        reference,
        toGroupInvitationReopenData(
          input.updatedAt,
          inviterChanged ? { inviterId: input.inviterId, pairId } : undefined,
        ),
      );

      if (current.groupName !== input.groupName) {
        await updateDoc(
          reference,
          toGroupInvitationRenameData(input.groupName, input.updatedAt),
        );
      }

      results.push({
        ...current,
        groupName: input.groupName,
        inviterId: input.inviterId,
        pairId: inviterChanged ? pairId : current.pairId,
        status: "pending",
        updatedAt: input.updatedAt,
      });
      continue;
    }

    const created: GroupInvitation = {
      id: invitationId,
      groupId: input.groupId,
      groupName: input.groupName,
      inviterId: input.inviterId,
      inviteeId,
      pairId,
      status: "pending",
      createdAt: input.updatedAt,
      updatedAt: input.updatedAt,
    };

    await setDoc(reference, toGroupInvitationData(created));
    results.push(created);
  }

  return results;
}

/** Invitee accept/reject and inviter cancel share this single field patch. */
export async function updateGroupInvitationStatusOperation(
  invitationId: string,
  status: GroupInvitationStatus,
  updatedAt: string,
): Promise<GroupInvitation> {
  await updateDoc(groupInvitationRef(invitationId), { status, updatedAt });

  const invitation = await getGroupInvitationOperation(invitationId);
  if (!invitation) throw new GroupOperationError("INVITATION_NOT_FOUND");

  return invitation;
}
