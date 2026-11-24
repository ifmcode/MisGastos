import { runTransaction } from "firebase/firestore";

import { db } from "@/lib/firebase";

import { GroupOperationError } from "../services/group.errors";
import type {
  Group,
  TransferGroupOwnershipInput,
} from "../types/group.types";
import { addGroupActivity } from "./group-activity.writes";
import { toGroupCodeOwnerData } from "./groups.data";
import { groupCodeRef, groupRef } from "./groups.operations";
import { mapGroupDocument } from "./groups.mapper";

/**
 * Owner promotes one active member inside a transaction: `ownerId` moves, the
 * member set is reordered owner-first (same uids, same size) and the
 * `owner-transferred` event commits with it. The old owner stays a regular
 * member, so the group always keeps exactly one owner.
 */
export async function transferGroupOwnershipOperation(
  input: TransferGroupOwnershipInput,
): Promise<Group> {
  let updated: Group | null = null;

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(groupRef(input.groupId));
    if (!snapshot.exists()) throw new GroupOperationError("GROUP_NOT_FOUND");

    const group = mapGroupDocument(
      snapshot.id,
      snapshot.data() as Record<string, unknown>,
    );
    if (!group) throw new GroupOperationError("GROUP_NOT_FOUND");
    if (group.ownerId !== input.actorId) {
      throw new GroupOperationError("NOT_GROUP_OWNER");
    }
    if (
      input.newOwnerId === group.ownerId ||
      !group.memberIds.includes(input.newOwnerId)
    ) {
      throw new GroupOperationError("INVALID_OWNERSHIP_TARGET");
    }

    const memberIds = [
      input.newOwnerId,
      ...group.memberIds.filter((uid) => uid !== input.newOwnerId),
    ];

    transaction.update(groupRef(group.id), {
      ownerId: input.newOwnerId,
      memberIds,
      updatedAt: input.updatedAt,
    });
    // The join-code projection follows the current owner in the same commit, so
    // a promoted owner can rename the group and receive join requests.
    if (group.joinCode) {
      transaction.update(
        groupCodeRef(group.joinCode),
        toGroupCodeOwnerData(input.newOwnerId),
      );
    }
    addGroupActivity(transaction, {
      type: "owner-transferred",
      groupId: group.id,
      actorId: input.actorId,
      targetUserId: input.newOwnerId,
      previousOwnerId: group.ownerId,
      newOwnerId: input.newOwnerId,
      createdAt: input.updatedAt,
    });
    updated = {
      ...group,
      ownerId: input.newOwnerId,
      memberIds,
      updatedAt: input.updatedAt,
    };
  });

  if (!updated) throw new GroupOperationError("GROUP_NOT_FOUND");

  return updated;
}
