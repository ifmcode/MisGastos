import type {
  CreateSharedExpenseDto,
  SharedExpense,
  UpdateSharedExpenseDto,
} from "../types/shared-expense.types";
import {
  createSharedExpenseLinkOperation,
  softDeleteSharedExpenseLinkOperation,
  updateSharedExpenseLinkOperation,
} from "./shared-expense-link.operations";
import {
  createSharedExpenseOperation,
  getSharedExpenseOperation,
  getSharedExpensesOperation,
  softDeleteSharedExpenseOperation,
  updateSharedExpenseOperation,
} from "./shared-expenses.operations";
import type {
  ISharedExpensesRepository,
  ISharedExpenseLinkRepository,
} from "./shared-expenses.repository";

export class FirebaseSharedExpensesRepository
  implements ISharedExpensesRepository, ISharedExpenseLinkRepository
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

  createExpenseLink(dto: CreateSharedExpenseDto): Promise<SharedExpense> {
    return createSharedExpenseLinkOperation(dto);
  }

  updateExpenseLink(
    viewerUid: string,
    expenseId: string,
    update: UpdateSharedExpenseDto,
  ): Promise<SharedExpense> {
    return updateSharedExpenseLinkOperation({
      viewerUid,
      expenseId,
      update,
    });
  }

  softDeleteExpenseLink(
    viewerUid: string,
    expenseId: string,
    deletedAt: string,
  ): Promise<void> {
    return softDeleteSharedExpenseLinkOperation({
      viewerUid,
      expenseId,
      deletedAt,
    });
  }
}
