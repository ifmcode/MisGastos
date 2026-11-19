import type { SharedExpense } from "@/features/shared-expenses/types/shared-expense.types";
import {
  buildExpenseLedgerEntries,
  filterActiveExpenses,
} from "@/features/shared-expenses/utils/expense-ledger";
import type { Settlement } from "@/features/settlements/types/settlement.types";
import { filterActiveSettlements } from "@/features/settlements/utils/settlement-ledger";
import type { CurrencyCode } from "@/shared/constants/currencies";

/** One movement of the friend pair: a shared expense or a settlement. */
export type FriendTimelineEntry =
  | {
      kind: "expense";
      key: string;
      date: string;
      createdAt: string;
      expense: SharedExpense;
    }
  | {
      kind: "settlement";
      key: string;
      date: string;
      createdAt: string;
      settlement: Settlement;
    };

export interface BuildFriendTimelineInput {
  /** Already filtered to the pair; soft-deleted rows are dropped defensively. */
  expenses: readonly SharedExpense[];
  settlements: readonly Settlement[];
}

/** What one expense did to the viewer: money lent or money borrowed. */
export interface ExpenseTimelineEffect {
  direction: "lent" | "borrowed";
  amountCents: number;
  currency: CurrencyCode;
}

/** Newest date first, then newest write, then key: deterministic on equal dates. */
function compareTimelineEntries(
  left: FriendTimelineEntry,
  right: FriendTimelineEntry,
): number {
  const dateOrder = right.date.localeCompare(left.date);
  if (dateOrder !== 0) return dateOrder;

  const createdOrder = right.createdAt.localeCompare(left.createdAt);
  if (createdOrder !== 0) return createdOrder;

  return left.key.localeCompare(right.key);
}

/**
 * Unified pair history: expenses and settlements interleaved newest first.
 * Soft-deleted records never reach the UI, and the keys stay stable because the
 * record id survives edits.
 */
export function buildFriendTimeline({
  expenses,
  settlements,
}: BuildFriendTimelineInput): FriendTimelineEntry[] {
  const expenseEntries = filterActiveExpenses(expenses).map(
    (expense): FriendTimelineEntry => ({
      kind: "expense",
      key: `expense:${expense.id}`,
      date: expense.date,
      createdAt: expense.createdAt,
      expense,
    }),
  );
  const settlementEntries = filterActiveSettlements(settlements).map(
    (settlement): FriendTimelineEntry => ({
      kind: "settlement",
      key: `settlement:${settlement.id}`,
      date: settlement.date,
      createdAt: settlement.createdAt,
      settlement,
    }),
  );

  return [...expenseEntries, ...settlementEntries].sort(compareTimelineEntries);
}

/**
 * Viewer effect of one expense, read from the shared ledger instead of a second
 * debt formula: the creditor lent, the debtor borrowed. Currencies are never
 * converted, so the amount keeps the expense currency.
 */
export function getExpenseTimelineEffect(
  expense: SharedExpense,
  viewerUid: string,
): ExpenseTimelineEffect | null {
  const viewer = viewerUid.trim();
  if (viewer.length === 0) return null;

  let lentCents = 0;
  let borrowedCents = 0;

  for (const entry of buildExpenseLedgerEntries([expense])) {
    if (entry.toUserId === viewer) {
      lentCents += entry.amountCents;
    } else if (entry.fromUserId === viewer) {
      borrowedCents += entry.amountCents;
    }
  }

  if (lentCents > 0) {
    return {
      direction: "lent",
      amountCents: lentCents,
      currency: expense.currency,
    };
  }
  if (borrowedCents > 0) {
    return {
      direction: "borrowed",
      amountCents: borrowedCents,
      currency: expense.currency,
    };
  }

  return null;
}
