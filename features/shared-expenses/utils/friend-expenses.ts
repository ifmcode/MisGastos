import type { SharedExpense } from "../types/shared-expense.types";
import { filterActiveExpenses, sortSharedExpenses } from "./expense-ledger";

/**
 * True when both uids take part in the expense. An empty uid, the same uid on
 * both sides or a missing participant all disqualify the record.
 */
export function isFriendExpense(
  expense: SharedExpense,
  viewerUid: string,
  friendUid: string,
): boolean {
  const viewer = viewerUid.trim();
  const friend = friendUid.trim();

  if (viewer.length === 0 || friend.length === 0 || viewer === friend) {
    return false;
  }

  return (
    expense.participantIds.includes(viewer) &&
    expense.participantIds.includes(friend)
  );
}

/** Active expenses of one pair in the order they were loaded. */
export function filterFriendExpenses(
  expenses: readonly SharedExpense[],
  viewerUid: string,
  friendUid: string,
): SharedExpense[] {
  return filterActiveExpenses(expenses).filter((expense) =>
    isFriendExpense(expense, viewerUid, friendUid),
  );
}

/** Active expenses of one pair, newest spending day first. */
export function getFriendExpenses(
  expenses: readonly SharedExpense[],
  viewerUid: string,
  friendUid: string,
): SharedExpense[] {
  return sortSharedExpenses(
    filterFriendExpenses(expenses, viewerUid, friendUid),
  );
}
