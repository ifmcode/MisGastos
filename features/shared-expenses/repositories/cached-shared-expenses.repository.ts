import { readCurrentOwnerId } from "@/shared/lib/local-db/current-owner";

import type {
  CreateSharedExpenseDto,
  SharedExpense,
  UpdateSharedExpenseDto,
} from "../types/shared-expense.types";
import {
  cacheSharedExpense,
  cacheSharedExpenses,
  readCachedSharedExpenses,
} from "./local-shared-expense.cache";
import type {
  ISharedExpensesRepository,
  ISharedExpenseLinkRepository,
} from "./shared-expenses.repository";

/**
 * Read-through 1:1 expenses. A list read mirrors the collection; a remote
 * failure falls back to the cache. Mutations delegate to the remote and mirror
 * the resulting record, so an online write is visible in airplane mode too.
 */
export class CachedSharedExpensesRepository
  implements ISharedExpensesRepository, ISharedExpenseLinkRepository
{
  constructor(
    private readonly remote: ISharedExpensesRepository &
      ISharedExpenseLinkRepository,
  ) {}

  async getExpense(expenseId: string): Promise<SharedExpense | null> {
    try {
      const expense = await this.remote.getExpense(expenseId);
      if (expense) {
        await this.mirror(expense);
        return expense;
      }

      // A locally created record is not on the server yet; never report it as
      // missing just because the remote read returned null.
      const cached = await this.readCached();
      return cached?.find((candidate) => candidate.id === expenseId) ?? null;
    } catch (error) {
      const cached = await this.readCached();
      const match = cached?.find((expense) => expense.id === expenseId);
      if (match) return match;
      throw error;
    }
  }

  async getExpenses(viewerUid: string): Promise<SharedExpense[]> {
    try {
      const expenses = await this.remote.getExpenses(viewerUid);
      await this.cacheList(viewerUid, expenses);
      return expenses;
    } catch (error) {
      const cached = await this.readCached();
      if (cached) return cached;
      throw error;
    }
  }

  async createExpense(dto: CreateSharedExpenseDto): Promise<SharedExpense> {
    return this.mirror(await this.remote.createExpense(dto));
  }

  async createExpenseLink(dto: CreateSharedExpenseDto): Promise<SharedExpense> {
    return this.mirror(await this.remote.createExpenseLink(dto));
  }

  async updateExpense(
    expenseId: string,
    update: UpdateSharedExpenseDto,
  ): Promise<SharedExpense> {
    return this.mirror(await this.remote.updateExpense(expenseId, update));
  }

  async updateExpenseLink(
    viewerUid: string,
    expenseId: string,
    update: UpdateSharedExpenseDto,
  ): Promise<SharedExpense> {
    return this.mirror(
      await this.remote.updateExpenseLink(viewerUid, expenseId, update),
    );
  }

  async softDeleteExpense(expenseId: string, deletedAt: string): Promise<void> {
    await this.remote.softDeleteExpense(expenseId, deletedAt);
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

  private async readCached(): Promise<SharedExpense[] | null> {
    const ownerId = readCurrentOwnerId();
    if (!ownerId) return null;

    return readCachedSharedExpenses(ownerId);
  }

  private async cacheList(
    viewerUid: string,
    expenses: readonly SharedExpense[],
  ): Promise<void> {
    try {
      await cacheSharedExpenses(viewerUid, expenses, new Date().toISOString());
    } catch {
      // Best effort: the online read already succeeded.
    }
  }

  private async mirror(expense: SharedExpense): Promise<SharedExpense> {
    const viewerId = readCurrentOwnerId();
    if (!viewerId) return expense;

    try {
      await cacheSharedExpense(viewerId, expense, new Date().toISOString());
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
