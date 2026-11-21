import type { IGroupExpensesRepository } from "../repositories/group-expenses.repository";
import type {
  CreateGroupExpenseDto,
  GroupExpense,
  UpdateGroupExpenseDto,
  ValidatedGroupExpense,
} from "../types/group-expense.types";

/** Full document of a new expense: `createdBy`/`createdAt` are immutable. */
export function buildCreateGroupExpenseDto(
  value: ValidatedGroupExpense,
  viewerUid: string,
  now: string,
): CreateGroupExpenseDto {
  return {
    groupId: value.groupId,
    payerId: value.payerId,
    amountCents: value.amountCents,
    currency: value.currency,
    splitMode: value.splitMode,
    participants: value.participants,
    description: value.description,
    date: value.date,
    createdBy: viewerUid,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
}

/** Only the mutable fields travel: the group and the creation stamp are fixed. */
export function buildUpdateGroupExpenseDto(
  value: ValidatedGroupExpense,
  now: string,
): UpdateGroupExpenseDto {
  return {
    payerId: value.payerId,
    amountCents: value.amountCents,
    currency: value.currency,
    splitMode: value.splitMode,
    participants: value.participants,
    description: value.description,
    date: value.date,
    updatedAt: now,
  };
}

export function createGroupExpenseRecord(
  repository: IGroupExpensesRepository,
  value: ValidatedGroupExpense,
  viewerUid: string,
  now: string,
): Promise<GroupExpense> {
  return repository.createExpense(
    buildCreateGroupExpenseDto(value, viewerUid, now),
  );
}

export function updateGroupExpenseRecord(
  repository: IGroupExpensesRepository,
  expenseId: string,
  value: ValidatedGroupExpense,
  now: string,
): Promise<GroupExpense> {
  return repository.updateExpense(
    expenseId,
    buildUpdateGroupExpenseDto(value, now),
  );
}

/** Soft delete only: the record keeps its audit trail and is never removed. */
export function softDeleteGroupExpenseRecord(
  repository: IGroupExpensesRepository,
  expenseId: string,
  deletedAt: string,
): Promise<void> {
  return repository.softDeleteExpense(expenseId, deletedAt);
}
