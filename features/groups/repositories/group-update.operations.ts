import { doc, getDoc, writeBatch, type WriteBatch } from "firebase/firestore";

import { db } from "@/lib/firebase";

import { GroupOperationError } from "../services/group.errors";
import type { Group, GroupMetadataUpdate } from "../types/group.types";
import { collectGroupMetadataChanges } from "../utils/group-activity";
import { addGroupActivity } from "./group-activity.writes";
import {
  GROUP_INVITATIONS_COLLECTION,
  toGroupCodeRenameData,
  toGroupInvitationRenameData,
  toGroupUpdateData,
} from "./groups.data";
import {
  getGroupInvitationsOperation,
  groupCodeRef,
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

/** One `group-updated` per metadata change and one setting event when toggled. */
function writeMetadataActivity(
  batch: WriteBatch,
  actorId: string,
  group: Group,
  update: GroupMetadataUpdate,
): void {
  const changedFields = collectGroupMetadataChanges(group, update);

  if (changedFields.length > 0) {
    addGroupActivity(batch, {
      type: "group-updated",
      groupId: group.id,
      actorId,
      changedFields,
      createdAt: update.updatedAt,
    });
  }

  if (group.simplifyDebts !== update.simplifyDebts) {
    addGroupActivity(batch, {
      type: "simplify-debts-changed",
      groupId: group.id,
      actorId,
      simplifyDebts: update.simplifyDebts,
      createdAt: update.updatedAt,
    });
  }
}

/**
 * Owner metadata edit. A rename also refreshes the denormalized `groupName` of
 * every pending invitation in the same batch, so the invitee list never shows
 * an old name. The metadata changes and the **Simplificar deudas** toggle are
 * appended to the history in that same batch, so group and feed never disagree.
 */
export async function updateGroupOperation(
  viewerUid: string,
  groupId: string,
  update: GroupMetadataUpdate,
): Promise<Group> {
  const group = await requireGroupDocument(groupId);
  const batch = writeBatch(db);

  batch.update(groupRef(group.id), toGroupUpdateData(update));
  writeMetadataActivity(batch, viewerUid, group, update);

  if (update.name !== group.name) {
    if (group.joinCode) {
      batch.update(
        groupCodeRef(group.joinCode),
        toGroupCodeRenameData(update.name),
      );
    }

    const invitations = await getGroupInvitationsOperation(group.id);

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
    simplifyDebts: update.simplifyDebts,
    updatedAt: update.updatedAt,
  };
}
