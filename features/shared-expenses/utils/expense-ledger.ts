import type {
  SharedExpense,
  SharedExpenseLedgerEntry,
} from "../types/shared-expense.types";

function isActive(expense: SharedExpense): boolean {
  return expense.deletedAt === null || expense.deletedAt.length === 0;
}

/** Soft-deleted expenses keep their audit trail but never feed balances. */
export function filterActiveExpenses(
  expenses: readonly SharedExpense[],
): SharedExpense[] {
  return expenses.filter(isActive);
}

/** Newest spending day first, then newest write, then id: a stable UI order. */
export function sortSharedExpenses(
  expenses: readonly SharedExpense[],
): SharedExpense[] {
  return [...expenses].sort((left, right) => {
    if (left.date !== right.date) return left.date < right.date ? 1 : -1;
    if (left.createdAt !== right.createdAt) {
      return left.createdAt < right.createdAt ? 1 : -1;
    }

    return left.id < right.id ? -1 : 1;
  });
}

/**
 * One ledger row per non-payer participant with a positive share: the debtor
 * owes the payer. Zero shares and soft-deleted expenses produce no debt.
 *
 * `id` is the expense id because 1:1 has a single debtor. When groups reuse this
 * helper, switch it to `${expense.id}:${participant.userId}` so React keys and
 * any dedupe stay unique per debtor.
 */
export function buildExpenseLedgerEntries(
  expenses: readonly SharedExpense[],
): SharedExpenseLedgerEntry[] {
  return filterActiveExpenses(expenses).flatMap((expense) =>
    expense.participants
      .filter(
        (participant) =>
          participant.userId !== expense.payerId && participant.shareCents > 0,
      )
      .map((participant) => ({
        id: expense.id,
        fromUserId: participant.userId,
        toUserId: expense.payerId,
        amountCents: participant.shareCents,
        currency: expense.currency,
        deletedAt: expense.deletedAt,
      })),
  );
}
