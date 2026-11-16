import type { IFriendsRepository } from "@/features/friends/repositories/friends.repository";

import type { ISharedExpensesRepository } from "../repositories/shared-expenses.repository";
import { validateSharedExpenseInput } from "../schemas/shared-expense.schema";
import type {
  SharedExpense,
  SharedExpenseInput,
  ValidatedSharedExpense,
} from "../types/shared-expense.types";
import { sortSharedExpenses } from "../utils/expense-ledger";
import {
  SharedExpenseOperationError,
  SharedExpenseValidationError,
} from "./shared-expense.errors";
import {
  assertSharedExpenseFriendship,
  buildCreateSharedExpenseDto,
  buildUpdateSharedExpenseDto,
} from "./shared-expense-persist";
import {
  assertExpenseParticipant,
  assertSameExpensePair,
  requireSharedExpense,
  requireSharedExpenseViewer,
} from "./shared-expenses.guards";

function validateInput(
  input: SharedExpenseInput,
  viewerUid: string,
): ValidatedSharedExpense {
  const validation = validateSharedExpenseInput(input, viewerUid);

  if (!validation.ok) throw new SharedExpenseValidationError(validation.error);

  return validation.value;
}

/**
 * 1:1 shared expenses. The service owns the participant and friendship guards;
 * the repository only talks to Firestore and the UI translates the error codes.
 */
export class SharedExpensesService {
  constructor(
    private readonly repository: ISharedExpensesRepository,
    private readonly friendsRepository: IFriendsRepository,
  ) {}

  /** Every expense of the viewer, soft-deleted included for the audit trail. */
  async getExpenses(viewerUid: string): Promise<SharedExpense[]> {
    const viewer = requireSharedExpenseViewer(viewerUid);
    const expenses = await this.repository.getExpenses(viewer);

    return sortSharedExpenses(expenses);
  }

  async getExpense(
    viewerUid: string,
    expenseId: string,
  ): Promise<SharedExpense> {
    const viewer = requireSharedExpenseViewer(viewerUid);
    const expense = await requireSharedExpense(this.repository, expenseId);
    assertExpenseParticipant(expense, viewer);

    return expense;
  }

  async createExpense(
    viewerUid: string,
    input: SharedExpenseInput,
  ): Promise<SharedExpense> {
    const viewer = requireSharedExpenseViewer(viewerUid);
    const value = validateInput(input, viewer);

    await assertSharedExpenseFriendship(
      this.friendsRepository,
      viewer,
      value.participantIds,
    );

    const now = new Date().toISOString();

    return this.repository.createExpense(
      buildCreateSharedExpenseDto(value, viewer, now),
    );
  }

  async updateExpense(
    viewerUid: string,
    expenseId: string,
    input: SharedExpenseInput,
  ): Promise<SharedExpense> {
    const viewer = requireSharedExpenseViewer(viewerUid);
    const existing = await requireSharedExpense(this.repository, expenseId);
    assertExpenseParticipant(existing, viewer);

    if (existing.deletedAt !== null) {
      throw new SharedExpenseOperationError("ALREADY_DELETED");
    }

    const value = validateInput(input, viewer);
    assertSameExpensePair(value.participantIds, existing);

    await assertSharedExpenseFriendship(
      this.friendsRepository,
      viewer,
      value.participantIds,
    );

    return this.repository.updateExpense(
      existing.id,
      buildUpdateSharedExpenseDto(value, new Date().toISOString()),
    );
  }

  /** Idempotent: deleting an already deleted expense is a no-op, not an error. */
  async deleteExpense(viewerUid: string, expenseId: string): Promise<void> {
    const viewer = requireSharedExpenseViewer(viewerUid);
    const existing = await requireSharedExpense(this.repository, expenseId);
    assertExpenseParticipant(existing, viewer);

    if (existing.deletedAt !== null) return;

    await this.repository.softDeleteExpense(
      existing.id,
      new Date().toISOString(),
    );
  }
}
