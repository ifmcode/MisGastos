import { collection, doc, writeBatch } from "firebase/firestore";

import { db } from "@/lib/firebase";
import { createFriendPairId } from "@/features/friends/utils/friend-pair";

import { GroupOperationError } from "../services/group.errors";
import type {
  CreateGroupWithInvitationsInput,
  CreateGroupWithInvitationsResult,
  Group,
  GroupInvitation,
} from "../types/group.types";
import {
  createGroupDocumentId,
  createGroupInvitationId,
} from "../utils/group-ids";
import { generateGroupJoinCode } from "../utils/group-join-code";
import { prepareGroupMemberIds } from "../utils/group-membership";
import {
  GROUP_CODES_COLLECTION,
  GROUP_INVITATIONS_COLLECTION,
  GROUPS_COLLECTION,
  toGroupCodeData,
  toGroupData,
  toGroupInvitationData,
} from "./groups.data";

/**
 * One batch: the group (memberIds = [ownerId]) plus every pending invitation.
 * The group id is owner-namespaced (`ownerId__autoId`), so the invitation create
 * rule proves the group belongs to the caller without reading it: a 19-invite
 * batch stays at 19 friendship reads, inside the 20-document-read budget.
 */
export async function createGroupWithInvitationsOperation(
  input: CreateGroupWithInvitationsInput,
): Promise<CreateGroupWithInvitationsResult> {
  const autoId = doc(collection(db, GROUPS_COLLECTION)).id;
  const groupId = createGroupDocumentId(input.ownerId, autoId);
  if (groupId.length === 0) throw new GroupOperationError("DUPLICATE_INVITEE");

  const groupReference = doc(db, GROUPS_COLLECTION, groupId);
  const joinCode = generateGroupJoinCode();
  const group: Group = {
    id: groupId,
    ownerId: input.ownerId,
    memberIds: prepareGroupMemberIds(input.ownerId),
    name: input.name,
    description: input.description,
    defaultCurrency: input.defaultCurrency,
    joinCode,
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
  };

  const invitations: GroupInvitation[] = input.inviteeIds.map((inviteeId) => ({
    id: createGroupInvitationId(group.id, inviteeId),
    groupId: group.id,
    groupName: group.name,
    inviterId: input.ownerId,
    inviteeId,
    pairId: createFriendPairId(input.ownerId, inviteeId),
    status: "pending",
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
  }));

  if (invitations.some((invitation) => invitation.pairId.length === 0)) {
    throw new GroupOperationError("DUPLICATE_INVITEE");
  }

  const batch = writeBatch(db);
  batch.set(groupReference, toGroupData(group));
  batch.set(
    doc(db, GROUP_CODES_COLLECTION, joinCode),
    toGroupCodeData({
      code: joinCode,
      groupId: group.id,
      ownerId: group.ownerId,
      groupName: group.name,
    }),
  );

  for (const invitation of invitations) {
    batch.set(
      doc(db, GROUP_INVITATIONS_COLLECTION, invitation.id),
      toGroupInvitationData(invitation),
    );
  }

  await batch.commit();

  return { group, invitations };
}
