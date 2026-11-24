import { runTransaction } from "firebase/firestore";

import { db } from "@/lib/firebase";

import { GroupOperationError } from "../services/group.errors";
import type { Group, RemoveGroupMemberInput } from "../types/group.types";
import { removeGroupMember } from "../utils/group-membership";
import { addGroupActivity } from "./group-activity.writes";
import { groupRef } from "./groups.operations";
import { mapGroupDocument } from "./groups.mapper";

/**
 * Owner removal of one member, never themselves. A transaction keeps the
 * read-modify-write of `memberIds` safe against a concurrent acceptance, and the
 * `member-removed` event commits with it so the feed never loses the removal.
 */
export async function removeGroupMemberOperation(
  input: RemoveGroupMemberInput,
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
    if (input.memberId === group.ownerId) {
      throw new GroupOperationError("CANNOT_REMOVE_OWNER");
    }
    if (!group.memberIds.includes(input.memberId)) {
      throw new GroupOperationError("MEMBER_NOT_FOUND");
    }

    const memberIds = removeGroupMember(group.memberIds, input.memberId);
    transaction.update(groupRef(group.id), {
      memberIds,
      updatedAt: input.updatedAt,
    });
    addGroupActivity(transaction, {
      type: "member-removed",
      groupId: group.id,
      actorId: input.actorId,
      targetUserId: input.memberId,
      targetName: input.targetName,
      createdAt: input.updatedAt,
    });
    updated = { ...group, memberIds, updatedAt: input.updatedAt };
  });

  if (!updated) throw new GroupOperationError("GROUP_NOT_FOUND");

  return updated;
}
