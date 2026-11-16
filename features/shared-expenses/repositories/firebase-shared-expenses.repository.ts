import type {
  CreateSharedExpenseDto,
  SharedExpense,
  UpdateSharedExpenseDto,
} from "../types/shared-expense.types";
import {
  createSharedExpenseOperation,
  getSharedExpenseOperation,
  getSharedExpensesOperation,
  softDeleteSharedExpenseOperation,
  updateSharedExpenseOperation,
} from "./shared-expenses.operations";
import type { ISharedExpensesRepository } from "./shared-expenses.repository";

export class FirebaseSharedExpensesRepository
  implements ISharedExpensesRepository
{
  getExpense(expenseId: string): Promise<SharedExpense | null> {
    return getSharedExpenseOperation(expenseId);
  }

  getExpenses(viewerUid: string): Promise<SharedExpense[]> {
    return getSharedExpensesOperation(viewerUid);
  }

  createExpense(dto: CreateSharedExpenseDto): Promise<SharedExpense> {
    return createSharedExpenseOperation(dto);
  }

  updateExpense(
    expenseId: string,
    update: UpdateSharedExpenseDto,
  ): Promise<SharedExpense> {
    return updateSharedExpenseOperation(expenseId, update);
  }

  softDeleteExpense(expenseId: string, deletedAt: string): Promise<void> {
    return softDeleteSharedExpenseOperation(expenseId, deletedAt);
  }
}
