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

  /** Only mutable fields; `groupId`, `createdBy` and `createdAt` never change. */
  updateExpense(
    expenseId: string,
    update: UpdateGroupExpenseDto,
  ): Promise<GroupExpense>;

  /** Soft delete: sets `deletedAt` and `updatedAt`, keeps the record. */
  softDeleteExpense(expenseId: string, deletedAt: string): Promise<void>;
}
