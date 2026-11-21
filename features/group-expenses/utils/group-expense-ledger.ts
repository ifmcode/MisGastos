import type {
  GroupExpense,
  GroupExpenseLedgerEntry,
} from "../types/group-expense.types";

function isActive(expense: GroupExpense): boolean {
  return expense.deletedAt === null;
}

/** Soft-deleted expenses keep their audit trail but never feed balances. */
export function filterActiveGroupExpenses(
  expenses: readonly GroupExpense[],
): GroupExpense[] {
  return expenses.filter(isActive);
}

/** Newest spending day first, then newest write, then id: a stable UI order. */
export function sortGroupExpenses(
  expenses: readonly GroupExpense[],
): GroupExpense[] {
  return [...expenses].sort((left, right) => {
    if (left.date !== right.date) return left.date < right.date ? 1 : -1;
    if (left.createdAt !== right.createdAt) {
      return left.createdAt < right.createdAt ? 1 : -1;
    }

    return left.id < right.id ? -1 : 1;
  });
}

/**
 * One row per non-payer participant with a positive share: the debtor owes the
 * payer that amount in the expense currency. The payer is credited implicitly
 * (they paid the whole expense) and a 0 share creates no debt.
 *
 * The row id is `${expense.id}:${participantId}` so it stays unique per debtor:
 * a group expense can have many of them, unlike the 1:1 slice. TICKET-010 folds
 * these direct rows into net balances and simplified suggestions.
 */
export function buildGroupExpenseLedgerEntries(
  expenses: readonly GroupExpense[],
): GroupExpenseLedgerEntry[] {
  return filterActiveGroupExpenses(expenses).flatMap((expense) =>
    expense.participants
      .filter(
        (participant) =>
          participant.userId !== expense.payerId && participant.shareCents > 0,
      )
      .map((participant) => ({
        id: `${expense.id}:${participant.userId}`,
        groupId: expense.groupId,
        fromUserId: participant.userId,
        toUserId: expense.payerId,
        amountCents: participant.shareCents,
        currency: expense.currency,
      })),
  );
}

/**
 * Cents the viewer owes for one expense, or 0 when they are not charged: a
 * missing row, a 0 share and the payer's own row never create a debt.
 */
export function getGroupExpenseViewerShare(
  expense: GroupExpense,
  viewerUid: string,
): number {
  const viewer = typeof viewerUid === "string" ? viewerUid.trim() : "";

  if (viewer.length === 0 || viewer === expense.payerId) return 0;

  const row = expense.participants.find(
    (participant) => participant.userId === viewer,
  );

  return row?.shareCents ?? 0;
}
