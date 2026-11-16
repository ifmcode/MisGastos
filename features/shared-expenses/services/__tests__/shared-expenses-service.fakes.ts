import type { ISharedExpensesRepository } from "../../repositories/shared-expenses.repository";
import type {
  CreateSharedExpenseDto,
  SharedExpense,
  UpdateSharedExpenseDto,
} from "../../types/shared-expense.types";
import { SharedExpenseOperationError } from "../shared-expense.errors";

/** In-memory repository: the service tests never touch Firestore. */
export class FakeSharedExpensesRepository
  implements ISharedExpensesRepository
{
  readonly expenses = new Map<string, SharedExpense>();
  readonly createCalls: CreateSharedExpenseDto[] = [];
  readonly updateCalls: Array<{
    expenseId: string;
    update: UpdateSharedExpenseDto;
  }> = [];
  readonly deleteCalls: Array<{ expenseId: string; deletedAt: string }> = [];
  failure: Error | null = null;

  seed(expense: SharedExpense): SharedExpense {
    this.expenses.set(expense.id, expense);
    return expense;
  }

  private guard(): void {
    if (this.failure) throw this.failure;
  }

  async getExpense(expenseId: string): Promise<SharedExpense | null> {
    this.guard();
    return this.expenses.get(expenseId) ?? null;
  }

  async getExpenses(viewerUid: string): Promise<SharedExpense[]> {
    this.guard();

    return Array.from(this.expenses.values()).filter((expense) =>
      expense.participantIds.includes(viewerUid),
    );
  }

  async createExpense(dto: CreateSharedExpenseDto): Promise<SharedExpense> {
    this.guard();
    this.createCalls.push(dto);

    const expense: SharedExpense = {
      id: `expense-${this.createCalls.length}`,
      ...dto,
    };
    this.expenses.set(expense.id, expense);

    return expense;
  }

  async updateExpense(
    expenseId: string,
    update: UpdateSharedExpenseDto,
  ): Promise<SharedExpense> {
    this.guard();
    this.updateCalls.push({ expenseId, update });

    const existing = this.expenses.get(expenseId);
    if (!existing) throw new SharedExpenseOperationError("EXPENSE_NOT_FOUND");

    const updated: SharedExpense = { ...existing, ...update };
    this.expenses.set(expenseId, updated);

    return updated;
  }

  async softDeleteExpense(
    expenseId: string,
    deletedAt: string,
  ): Promise<void> {
    this.guard();
    this.deleteCalls.push({ expenseId, deletedAt });

    const existing = this.expenses.get(expenseId);
    if (!existing) return;

    this.expenses.set(expenseId, { ...existing, deletedAt, updatedAt: deletedAt });
  }
}
