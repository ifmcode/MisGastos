import type { ISharedExpensesRepository } from "../repositories/shared-expenses.repository";
import type { SharedExpense } from "../types/shared-expense.types";
import { SharedExpenseOperationError } from "./shared-expense.errors";

/** Shared expenses always belong to a signed-in user; blank ids are rejected. */
export function requireSharedExpenseViewer(viewerUid: unknown): string {
  const viewer = typeof viewerUid === "string" ? viewerUid.trim() : "";

  if (viewer.length === 0) {
    throw new SharedExpenseOperationError("SIGN_IN_REQUIRED");
  }

  return viewer;
}

export function assertExpenseParticipant(
  expense: SharedExpense,
  viewerUid: string,
): void {
  if (!expense.participantIds.includes(viewerUid)) {
    throw new SharedExpenseOperationError("NOT_PARTICIPANT");
  }
}

/** Loads the record or fails with a stable code, never with a sentence. */
export async function requireSharedExpense(
  repository: ISharedExpensesRepository,
  expenseId: string,
): Promise<SharedExpense> {
  const id = expenseId.trim();
  const expense = id.length > 0 ? await repository.getExpense(id) : null;

  if (!expense) throw new SharedExpenseOperationError("EXPENSE_NOT_FOUND");

  return expense;
}

/**
 * An edit can change amounts and shares but never the pair: retargeting the
 * expense to another friend is a permission failure, not a new record.
 */
export function assertSameExpensePair(
  participantIds: readonly string[],
  expense: SharedExpense,
): void {
  const sameIds =
    participantIds.length === expense.participantIds.length &&
    participantIds.every((uid, index) => expense.participantIds[index] === uid);

  if (!sameIds || participantIds.join("__") !== expense.pairId) {
    throw new SharedExpenseOperationError("NOT_PARTICIPANT");
  }
}
