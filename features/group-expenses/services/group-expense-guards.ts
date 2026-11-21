import type { IGroupsRepository } from "@/features/groups/repositories/groups.repository";
import type { Group } from "@/features/groups/types/group.types";
import { isGroupMember } from "@/features/groups/utils/group-membership";

import type { IGroupExpensesRepository } from "../repositories/group-expenses.repository";
import { validateGroupExpenseInput } from "../schemas/group-expense.schema";
import type {
  GroupExpense,
  GroupExpenseInput,
  ValidatedGroupExpense,
} from "../types/group-expense.types";
import {
  hasFormerGroupExpenseMembers,
  hasGroupExpenseEditRights,
} from "../utils/group-expense-permissions";
import {
  GroupExpenseOperationError,
  GroupExpenseValidationError,
} from "./group-expense.errors";

/** Every use case requires the signed-in uid; a blank one is not a session. */
export function requireGroupExpenseViewer(viewerUid: unknown): string {
  const viewer = typeof viewerUid === "string" ? viewerUid.trim() : "";

  if (viewer.length === 0) {
    throw new GroupExpenseOperationError("SIGN_IN_REQUIRED");
  }

  return viewer;
}

/** Loads the group or fails with a stable code; rules deny a non-member read. */
export async function requireGroupForExpense(
  repository: IGroupsRepository,
  groupId: string,
): Promise<Group> {
  const id = typeof groupId === "string" ? groupId.trim() : "";
  const group = id.length > 0 ? await repository.getGroup(id) : null;

  if (!group) throw new GroupExpenseOperationError("GROUP_NOT_FOUND");

  return group;
}

/** Any active member reads and creates; only editors write an existing one. */
export function assertGroupExpenseMember(group: Group, viewerUid: string): void {
  if (!isGroupMember(group.memberIds, viewerUid)) {
    throw new GroupExpenseOperationError("NOT_GROUP_MEMBER");
  }
}

/** Defense in depth: the schema already reports PAYER_NOT_MEMBER. */
export function assertPayerIsMember(payerId: string, group: Group): void {
  if (!isGroupMember(group.memberIds, payerId)) {
    throw new GroupExpenseOperationError("PAYER_NOT_MEMBER");
  }
}

/** Loads the record or fails with a stable code, never with a sentence. */
export async function requireGroupExpense(
  repository: IGroupExpensesRepository,
  expenseId: string,
): Promise<GroupExpense> {
  const id = typeof expenseId === "string" ? expenseId.trim() : "";
  const expense = id.length > 0 ? await repository.getExpense(id) : null;

  if (!expense) throw new GroupExpenseOperationError("EXPENSE_NOT_FOUND");

  return expense;
}

export function assertExpenseEditor(
  expense: GroupExpense,
  group: Group,
  viewerUid: string,
): void {
  if (!hasGroupExpenseEditRights(expense, group, viewerUid)) {
    throw new GroupExpenseOperationError("NOT_EXPENSE_EDITOR");
  }
}

export function assertExpenseNotDeleted(expense: GroupExpense): void {
  if (expense.deletedAt !== null) {
    throw new GroupExpenseOperationError("ALREADY_DELETED");
  }
}

/**
 * TICKET-068 owns the balance-safe membership lifecycle. Until then the owner
 * can remove a member whose share still exists, so the stored expense must not
 * be rewritten with a smaller participant set: doing so would silently move
 * debt. Deleting it stays allowed.
 */
export function assertExpenseHasCurrentMembers(
  expense: GroupExpense,
  group: Group,
): void {
  if (hasFormerGroupExpenseMembers(expense, group)) {
    throw new GroupExpenseOperationError("EXPENSE_HAS_FORMER_MEMBERS");
  }
}

/** Retargeting an expense to another group is a permission failure. */
export function assertSameGroup(groupId: string, expense: GroupExpense): void {
  if (groupId.trim() !== expense.groupId) {
    throw new GroupExpenseOperationError("GROUP_CHANGED");
  }
}

/** Validates the form payload and throws the domain validation error. */
export function validateGroupExpenseOrThrow(
  input: GroupExpenseInput,
  viewerUid: string,
  group: Group,
): ValidatedGroupExpense {
  const validation = validateGroupExpenseInput(input, viewerUid, group.memberIds);

  if (!validation.ok) {
    throw new GroupExpenseValidationError(validation.error);
  }

  return validation.value;
}
