import type { GroupActivityInput } from "../types/group-activity.types";

/** Subcollection of a group: `groups/{groupId}/activity/{activityId}`. */
export const GROUP_ACTIVITY_SUBCOLLECTION = "activity";

/**
 * Stored shape of one event. Every key is written explicitly (`null`/`[]`
 * instead of `undefined`) because Firestore rejects undefined values and the
 * rules and the mapper expect the full field list on every document.
 */
export function buildGroupActivityData(
  input: GroupActivityInput,
): Record<string, unknown> {
  return {
    type: input.type,
    groupId: input.groupId,
    actorId: input.actorId,
    targetUserId: input.targetUserId ?? null,
    targetName: input.targetName ?? null,
    expenseId: input.expenseId ?? null,
    settlementId: input.settlementId ?? null,
    // Settlement pair (`fromUserId` pays `toUserId`); null on every other type.
    fromUserId: input.fromUserId ?? null,
    toUserId: input.toUserId ?? null,
    amountCents: input.amountCents ?? null,
    currency: input.currency ?? null,
    description: input.description ?? null,
    changedFields: input.changedFields ? [...input.changedFields] : [],
    simplifyDebts: input.simplifyDebts ?? null,
    previousOwnerId: input.previousOwnerId ?? null,
    newOwnerId: input.newOwnerId ?? null,
    createdAt: input.createdAt,
  };
}
