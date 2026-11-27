import { readCurrentOwnerId } from "@/shared/lib/local-db/current-owner";

import type {
  CreateGroupExpenseDto,
  GroupExpense,
  UpdateGroupExpenseDto,
} from "../types/group-expense.types";
import {
  cacheGroupExpense,
  cacheGroupExpenses,
  readCachedGroupExpenseById,
  readCachedGroupExpenses,
} from "./local-group-expense.cache";
import type {
  IGroupExpensesRepository,
  IGroupExpenseLinkRepository,
} from "./group-expenses.repository";

/**
 * Read-through group expenses. The list is cached per group; a remote failure
 * falls back to that group's cache. Mutations delegate and mirror the record.
 */
export class CachedGroupExpensesRepository
  implements IGroupExpensesRepository, IGroupExpenseLinkRepository
{
  constructor(
    private readonly remote: IGroupExpensesRepository &
      IGroupExpenseLinkRepository,
  ) {}

  async getExpense(expenseId: string): Promise<GroupExpense | null> {
    try {
      const expense = await this.remote.getExpense(expenseId);
      if (expense) {
        await this.mirror(expense);
        return expense;
      }

      const ownerId = readCurrentOwnerId();
      if (!ownerId) return null;

      return readCachedGroupExpenseById(ownerId, expenseId);
    } catch (error) {
      const ownerId = readCurrentOwnerId();
      if (!ownerId) throw error;

      const match = await readCachedGroupExpenseById(ownerId, expenseId);
      if (match) return match;
      throw error;
    }
  }

  async getGroupExpenses(groupId: string): Promise<GroupExpense[]> {
    try {
      const expenses = await this.remote.getGroupExpenses(groupId);
      await this.cacheList(groupId, expenses);
      return expenses;
    } catch (error) {
      const ownerId = readCurrentOwnerId();
      if (!ownerId) throw error;

      const cached = await readCachedGroupExpenses(ownerId, groupId);
      if (cached) return cached;
      throw error;
    }
  }

  async createExpense(dto: CreateGroupExpenseDto): Promise<GroupExpense> {
    return this.mirror(await this.remote.createExpense(dto));
  }

  async createExpenseLink(dto: CreateGroupExpenseDto): Promise<GroupExpense> {
    return this.mirror(await this.remote.createExpenseLink(dto));
  }

  async updateExpense(
    expenseId: string,
    update: UpdateGroupExpenseDto,
    viewerUid: string,
  ): Promise<GroupExpense> {
    return this.mirror(
      await this.remote.updateExpense(expenseId, update, viewerUid),
    );
  }

  async updateExpenseLink(
    viewerUid: string,
    expenseId: string,
    update: UpdateGroupExpenseDto,
  ): Promise<GroupExpense> {
    return this.mirror(
      await this.remote.updateExpenseLink(viewerUid, expenseId, update),
    );
  }

  async softDeleteExpense(
    expenseId: string,
    deletedAt: string,
    viewerUid: string,
  ): Promise<void> {
    await this.remote.softDeleteExpense(expenseId, deletedAt, viewerUid);
    await this.refresh(expenseId);
  }

  async softDeleteExpenseLink(
    viewerUid: string,
    expenseId: string,
    deletedAt: string,
  ): Promise<void> {
    await this.remote.softDeleteExpenseLink(viewerUid, expenseId, deletedAt);
    await this.refresh(expenseId);
  }

  private async cacheList(
    groupId: string,
    expenses: readonly GroupExpense[],
  ): Promise<void> {
    const ownerId = readCurrentOwnerId();
    if (!ownerId) return;

    try {
      await cacheGroupExpenses(
        ownerId,
        groupId,
        expenses,
        new Date().toISOString(),
      );
    } catch {
      // Best effort: the online read already succeeded.
    }
  }

  private async mirror(expense: GroupExpense): Promise<GroupExpense> {
    const ownerId = readCurrentOwnerId();
    if (!ownerId) return expense;

    try {
      await cacheGroupExpense(ownerId, expense, new Date().toISOString());
    } catch {
      // Best effort.
    }

    return expense;
  }

  private async refresh(expenseId: string): Promise<void> {
    try {
      const updated = await this.remote.getExpense(expenseId);
      if (updated) await this.mirror(updated);
    } catch {
      // Best effort: the mutation already succeeded.
    }
  }
}
