import { doc, getDoc, runTransaction, writeBatch } from "firebase/firestore";

import { db } from "@/lib/firebase";

import { GroupOperationError } from "../services/group.errors";
import type { Group, GroupMetadataUpdate } from "../types/group.types";
import { removeGroupMember } from "../utils/group-membership";
import {
  GROUP_INVITATIONS_COLLECTION,
  toGroupInvitationRenameData,
  toGroupUpdateData,
} from "./groups.data";
import {
  getGroupInvitationsOperation,
  groupRef,
} from "./groups.operations";
import { mapGroupDocument } from "./groups.mapper";

async function requireGroupDocument(groupId: string): Promise<Group> {
  const snapshot = await getDoc(groupRef(groupId));
  if (!snapshot.exists()) throw new GroupOperationError("GROUP_NOT_FOUND");

  const group = mapGroupDocument(
    snapshot.id,
    snapshot.data() as Record<string, unknown>,
  );
  if (!group) throw new GroupOperationError("GROUP_NOT_FOUND");

  return group;
}

/**
 * Owner metadata edit. A rename also refreshes the denormalized `groupName` of
 * every pending invitation in the same batch, so the invitee list never shows
 * an old name. The rules allow exactly these two write shapes.
 */
export async function updateGroupOperation(
  groupId: string,
  update: GroupMetadataUpdate,
): Promise<Group> {
  const group = await requireGroupDocument(groupId);
  const batch = writeBatch(db);

  batch.update(groupRef(group.id), toGroupUpdateData(update));

  if (update.name !== group.name) {
    const invitations = await getGroupInvitationsOperation(
      group.ownerId,
      group.id,
    );

    for (const invitation of invitations) {
      if (invitation.status !== "pending") continue;
      if (invitation.groupName === update.name) continue;

      batch.update(
        doc(db, GROUP_INVITATIONS_COLLECTION, invitation.id),
        toGroupInvitationRenameData(update.name, update.updatedAt),
      );
    }
  }

  await batch.commit();

  return {
    ...group,
    name: update.name,
    description: update.description,
    defaultCurrency: update.defaultCurrency,
    updatedAt: update.updatedAt,
  };
}

/**
 * Owner removal of one member, never themselves. A transaction keeps the
 * read-modify-write of `memberIds` safe against a concurrent acceptance.
 */
export async function removeGroupMemberOperation(
  groupId: string,
  memberId: string,
  updatedAt: string,
): Promise<Group> {
  let updated: Group | null = null;

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(groupRef(groupId));
    if (!snapshot.exists()) throw new GroupOperationError("GROUP_NOT_FOUND");

    const group = mapGroupDocument(
      snapshot.id,
      snapshot.data() as Record<string, unknown>,
    );
    if (!group) throw new GroupOperationError("GROUP_NOT_FOUND");
    if (memberId === group.ownerId) {
      throw new GroupOperationError("CANNOT_REMOVE_OWNER");
    }
    if (!group.memberIds.includes(memberId)) {
      throw new GroupOperationError("MEMBER_NOT_FOUND");
    }

    const memberIds = removeGroupMember(group.memberIds, memberId);
    transaction.update(groupRef(group.id), { memberIds, updatedAt });
    updated = { ...group, memberIds, updatedAt };
  });

  if (!updated) throw new GroupOperationError("GROUP_NOT_FOUND");

  return updated;
}
