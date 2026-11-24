import { runTransaction } from "firebase/firestore";

import { db } from "@/lib/firebase";

import { GroupOperationError } from "../services/group.errors";
import type { Group, LeaveGroupInput } from "../types/group.types";
import { removeGroupMember } from "../utils/group-membership";
import { addGroupActivity } from "./group-activity.writes";
import { groupRef } from "./groups.operations";
import { mapGroupDocument } from "./groups.mapper";

/**
 * A non-owner leaves by themselves. The transaction re-reads the group so a
 * concurrent acceptance/removal cannot corrupt `memberIds`, re-checks that the
 * caller is a member and not the owner, then appends the `member-left` event in
 * the same commit: the feed keeps the actor, the target and the name snapshot.
 */
export async function leaveGroupOperation(
  input: LeaveGroupInput,
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
    if (!group.memberIds.includes(input.memberId)) {
      throw new GroupOperationError("MEMBER_NOT_FOUND");
    }
    if (input.memberId === group.ownerId) {
      throw new GroupOperationError("CANNOT_REMOVE_OWNER");
    }

    const memberIds = removeGroupMember(group.memberIds, input.memberId);
    transaction.update(groupRef(group.id), {
      memberIds,
      updatedAt: input.updatedAt,
    });
    addGroupActivity(transaction, {
      type: "member-left",
      groupId: group.id,
      actorId: input.memberId,
      targetUserId: input.memberId,
      targetName: input.targetName,
      createdAt: input.updatedAt,
    });
    updated = { ...group, memberIds, updatedAt: input.updatedAt };
  });

  if (!updated) throw new GroupOperationError("GROUP_NOT_FOUND");

  return updated;
}
