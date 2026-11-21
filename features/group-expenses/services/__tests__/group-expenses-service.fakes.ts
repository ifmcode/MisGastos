import type { Group } from "@/features/groups/types/group.types";

import type { IGroupExpensesRepository } from "../../repositories/group-expenses.repository";
import type {
  CreateGroupExpenseDto,
  GroupExpense,
  UpdateGroupExpenseDto,
} from "../../types/group-expense.types";
import { GroupExpenseOperationError } from "../group-expense.errors";

export const GROUP_ID = "user-a__group-1";
export const NOW = "2026-11-20T10:00:00.000Z";

export function buildGroup(overrides: Partial<Group> = {}): Group {
  return {
    id: GROUP_ID,
    ownerId: "user-a",
    memberIds: ["user-a", "user-b", "user-c"],
    name: "Viaje",
    description: null,
    defaultCurrency: "EUR",
    joinCode: "ABCD2345",
    createdAt: "2026-11-01T10:00:00.000Z",
    updatedAt: "2026-11-01T10:00:00.000Z",
    ...overrides,
  };
}

export function buildExpense(
  overrides: Partial<GroupExpense> = {},
): GroupExpense {
  return {
    id: "expense-1",
    groupId: GROUP_ID,
    payerId: "user-a",
    amountCents: 1000,
    currency: "EUR",
    splitMode: "equal",
    participants: [
      { userId: "user-a", shareCents: 500 },
      { userId: "user-b", shareCents: 500 },
    ],
    description: "Dinner",
    date: "2026-11-10",
    createdBy: "user-a",
    createdAt: NOW,
    updatedAt: NOW,
    deletedAt: null,
    ...overrides,
  };
}

/** In-memory repository: the service tests never touch Firestore. */
export class FakeGroupExpensesRepository implements IGroupExpensesRepository {
  readonly expenses = new Map<string, GroupExpense>();
  readonly createCalls: CreateGroupExpenseDto[] = [];
  readonly updateCalls: Array<{
    expenseId: string;
    update: UpdateGroupExpenseDto;
  }> = [];
  readonly deleteCalls: Array<{ expenseId: string; deletedAt: string }> = [];
  failure: Error | null = null;

  seed(expense: GroupExpense): GroupExpense {
    this.expenses.set(expense.id, expense);
    return expense;
  }

  private guard(): void {
    if (this.failure) throw this.failure;
  }

  async getExpense(expenseId: string): Promise<GroupExpense | null> {
    this.guard();
    return this.expenses.get(expenseId) ?? null;
  }

  async getGroupExpenses(groupId: string): Promise<GroupExpense[]> {
    this.guard();

    return Array.from(this.expenses.values()).filter(
      (expense) => expense.groupId === groupId,
    );
  }

  async createExpense(dto: CreateGroupExpenseDto): Promise<GroupExpense> {
    this.guard();
    this.createCalls.push(dto);

    const expense: GroupExpense = {
      id: `expense-${this.createCalls.length}`,
      ...dto,
    };
    this.expenses.set(expense.id, expense);

    return expense;
  }

  async updateExpense(
    expenseId: string,
    update: UpdateGroupExpenseDto,
  ): Promise<GroupExpense> {
    this.guard();
    this.updateCalls.push({ expenseId, update });

    const existing = this.expenses.get(expenseId);
    if (!existing) throw new GroupExpenseOperationError("EXPENSE_NOT_FOUND");

    const updated: GroupExpense = { ...existing, ...update };
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
