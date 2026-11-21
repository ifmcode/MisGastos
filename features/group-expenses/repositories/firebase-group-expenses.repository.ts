import type {
  CreateGroupExpenseDto,
  GroupExpense,
  UpdateGroupExpenseDto,
} from "../types/group-expense.types";
import {
  createGroupExpenseOperation,
  getGroupExpenseOperation,
  getGroupExpensesOperation,
  softDeleteGroupExpenseOperation,
  updateGroupExpenseOperation,
} from "./group-expenses.operations";
import type { IGroupExpensesRepository } from "./group-expenses.repository";

/** Firestore implementation: no business rule lives here. */
export class FirebaseGroupExpensesRepository
  implements IGroupExpensesRepository
{
  getExpense(expenseId: string): Promise<GroupExpense | null> {
    return getGroupExpenseOperation(expenseId);
  }

  getGroupExpenses(groupId: string): Promise<GroupExpense[]> {
    return getGroupExpensesOperation(groupId);
  }

  createExpense(dto: CreateGroupExpenseDto): Promise<GroupExpense> {
    return createGroupExpenseOperation(dto);
  }

  updateExpense(
    expenseId: string,
    update: UpdateGroupExpenseDto,
  ): Promise<GroupExpense> {
    return updateGroupExpenseOperation(expenseId, update);
  }

  softDeleteExpense(expenseId: string, deletedAt: string): Promise<void> {
    return softDeleteGroupExpenseOperation(expenseId, deletedAt);
  }
}
