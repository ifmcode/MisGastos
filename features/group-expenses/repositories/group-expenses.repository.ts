import type {
  CreateGroupExpenseDto,
  GroupExpense,
  UpdateGroupExpenseDto,
} from "../types/group-expense.types";

export interface IGroupExpensesRepository {
  /** Reads one expense by its generated id; rules keep it group-member-only. */
  getExpense(expenseId: string): Promise<GroupExpense | null>;

  /** Every expense of one group, soft-deleted ones included (audit trail). */
  getGroupExpenses(groupId: string): Promise<GroupExpense[]>;

  createExpense(dto: CreateGroupExpenseDto): Promise<GroupExpense>;

  /** Only mutable fields; the actor feeds the `expense-updated` history event. */
  updateExpense(
    expenseId: string,
    update: UpdateGroupExpenseDto,
    viewerUid: string,
  ): Promise<GroupExpense>;

  /** Soft delete: sets `deletedAt` and `updatedAt`, keeps the record. */
  softDeleteExpense(
    expenseId: string,
    deletedAt: string,
    viewerUid: string,
  ): Promise<void>;
}

/**
 * Atomic pair "group expense + linked personal movement". Kept apart from the
 * social-only repository because every call spans the expense, the movement and
 * one or two of the payer's wallets inside a single `runTransaction`. The group
 * ledger is never touched: the movement is a personal mirror.
 */
export interface IGroupExpenseLinkRepository {
  createExpenseLink(dto: CreateGroupExpenseDto): Promise<GroupExpense>;

  updateExpenseLink(
    viewerUid: string,
    expenseId: string,
    update: UpdateGroupExpenseDto,
  ): Promise<GroupExpense>;

  softDeleteExpenseLink(
    viewerUid: string,
    expenseId: string,
    deletedAt: string,
  ): Promise<void>;
}
