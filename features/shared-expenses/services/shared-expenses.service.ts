import type { ICategoryRepository } from "@/features/categories/repositories/category.repository";
import type { IFriendsRepository } from "@/features/friends/repositories/friends.repository";

import type {
  ISharedExpensesRepository,
  ISharedExpenseLinkRepository,
} from "../repositories/shared-expenses.repository";
import type {
  SharedExpense,
  SharedExpenseInput,
} from "../types/shared-expense.types";
import { sortSharedExpenses } from "../utils/expense-ledger";
import { ensureSharedExpenseCategory as ensureCategoryDocument } from "./shared-expense-category";
import { SharedExpenseOperationError } from "./shared-expense.errors";
import { assertSharedExpenseFriendship } from "./shared-expense-persist";
import {
  createSharedExpenseRecord,
  deleteSharedExpenseRecord,
  updateSharedExpenseRecord,
  type SharedExpenseWriteDeps,
} from "./shared-expense-write";
import {
  assertExpenseParticipant,
  assertSameExpensePair,
  requireSharedExpense,
  requireSharedExpenseViewer,
  validateSharedExpenseOrThrow,
} from "./shared-expenses.guards";

/**
 * 1:1 shared expenses. The service owns the participant and friendship guards;
 * the repositories only talk to Firestore and the UI translates error codes.
 *
 * `linkRepository` handles the atomic pair "expense + personal movement" and is
 * only used when a wallet is selected; social-only expenses keep the old path.
 */
export class SharedExpensesService {
  private readonly writeDeps: SharedExpenseWriteDeps;

  constructor(
    private readonly repository: ISharedExpensesRepository,
    private readonly friendsRepository: IFriendsRepository,
    linkRepository: ISharedExpenseLinkRepository,
    categoryRepository: ICategoryRepository,
  ) {
    this.writeDeps = { repository, linkRepository, categoryRepository };
  }

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

  /**
   * Returns the deterministic "Gastos compartidos" category id, creating it the
   * first time a payer links a movement. Existing categories are never rewritten.
   */
  ensureSharedExpenseCategory(ownerId: string): Promise<string> {
    return ensureCategoryDocument(this.writeDeps.categoryRepository, ownerId);
  }

  async createExpense(
    viewerUid: string,
    input: SharedExpenseInput,
  ): Promise<SharedExpense> {
    const viewer = requireSharedExpenseViewer(viewerUid);
    const value = validateSharedExpenseOrThrow(input, viewer);

    await assertSharedExpenseFriendship(
      this.friendsRepository,
      viewer,
      value.participantIds,
    );

    return createSharedExpenseRecord(
      this.writeDeps,
      value,
      viewer,
      new Date().toISOString(),
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

    const value = validateSharedExpenseOrThrow(input, viewer);
    assertSameExpensePair(value.participantIds, existing);

    await assertSharedExpenseFriendship(
      this.friendsRepository,
      viewer,
      value.participantIds,
    );

    return updateSharedExpenseRecord(
      this.writeDeps,
      existing,
      value,
      viewer,
      new Date().toISOString(),
    );
  }

  /** Idempotent: deleting an already deleted expense is a no-op, not an error. */
  async deleteExpense(viewerUid: string, expenseId: string): Promise<void> {
    const viewer = requireSharedExpenseViewer(viewerUid);
    const existing = await requireSharedExpense(this.repository, expenseId);
    assertExpenseParticipant(existing, viewer);

    if (existing.deletedAt !== null) return;

    return deleteSharedExpenseRecord(
      this.writeDeps,
      existing,
      viewer,
      new Date().toISOString(),
    );
  }
}
