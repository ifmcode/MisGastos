import type { Group } from "@/features/groups/types/group.types";

import type { GroupExpense } from "../types/group-expense.types";

function readUid(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * The group owner can moderate any expense; the creator and the payer can edit
 * or delete their own. Every other active member is read-only.
 */
export function hasGroupExpenseEditRights(
  expense: GroupExpense,
  group: Group,
  viewerUid: unknown,
): boolean {
  const viewer = readUid(viewerUid);
  if (viewer.length === 0) return false;

  return (
    group.ownerId === viewer ||
    expense.createdBy === viewer ||
    expense.payerId === viewer
  );
}

/** UI-facing: an active expense the viewer may soft-delete. */
export function canDeleteGroupExpense(
  expense: GroupExpense,
  group: Group,
  viewerUid: unknown,
): boolean {
  return (
    expense.deletedAt === null &&
    hasGroupExpenseEditRights(expense, group, viewerUid)
  );
}

/**
 * A member can be removed while an expense still references them (the balance
 * guard belongs to TICKET-068). Reopening the form would drop that share and
 * rewrite the ledger, so such an expense stays read-only except for deletion.
 */
export function hasFormerGroupExpenseMembers(
  expense: GroupExpense,
  group: Group,
): boolean {
  const members = new Set(group.memberIds);

  return (
    !members.has(expense.payerId) ||
    expense.participants.some((participant) => !members.has(participant.userId))
  );
}

/**
 * UI-facing edit permission: the delete rights plus a participant list that is
 * still inside the active group. An expense with a former member is read-only
 * (the owner may still soft-delete it).
 */
export function canEditGroupExpense(
  expense: GroupExpense,
  group: Group,
  viewerUid: unknown,
): boolean {
  return (
    canDeleteGroupExpense(expense, group, viewerUid) &&
    !hasFormerGroupExpenseMembers(expense, group)
  );
}
