import type {
  CreateSharedExpenseDto,
  SharedExpense,
  UpdateSharedExpenseDto,
} from "../types/shared-expense.types";

export interface ISharedExpensesRepository {
  /** Reads one expense by its generated id; rules keep it participant-only. */
  getExpense(expenseId: string): Promise<SharedExpense | null>;

  /** Every expense the viewer participates in, soft-deleted ones included. */
  getExpenses(viewerUid: string): Promise<SharedExpense[]>;

  createExpense(dto: CreateSharedExpenseDto): Promise<SharedExpense>;

  /** Only mutable fields; the pair and `createdAt` never change. */
  updateExpense(
    expenseId: string,
    update: UpdateSharedExpenseDto,
  ): Promise<SharedExpense>;

  /** Soft delete: sets `deletedAt` and `updatedAt`, keeps the record. */
  softDeleteExpense(expenseId: string, deletedAt: string): Promise<void>;
}
