import type { GroupExpense } from "../types/group-expense.types";
import type { GroupSettlement } from "../types/group-settlement.types";

/** One movement of the group register: a group expense or a settlement. */
export type GroupTimelineEntry =
  | { kind: "expense"; key: string; expense: GroupExpense }
  | { kind: "settlement"; key: string; settlement: GroupSettlement };

export interface BuildGroupTimelineInput {
  /** Already filtered to the group; soft-deleted rows are dropped defensively. */
  expenses: readonly GroupExpense[];
  settlements: readonly GroupSettlement[];
}

function getEntryDate(entry: GroupTimelineEntry): string {
  return entry.kind === "expense" ? entry.expense.date : entry.settlement.date;
}

function getEntryCreatedAt(entry: GroupTimelineEntry): string {
  return entry.kind === "expense"
    ? entry.expense.createdAt
    : entry.settlement.createdAt;
}

/** Newest date first, then newest write, then key: deterministic on ties. */
function compareTimelineEntries(
  left: GroupTimelineEntry,
  right: GroupTimelineEntry,
): number {
  const dateOrder = getEntryDate(right).localeCompare(getEntryDate(left));
  if (dateOrder !== 0) return dateOrder;

  const createdOrder = getEntryCreatedAt(right).localeCompare(
    getEntryCreatedAt(left),
  );
  if (createdOrder !== 0) return createdOrder;

  return left.key.localeCompare(right.key);
}

/**
 * Unified group history: active expenses and settlements interleaved newest
 * first, sharing the same order rules as the friend pair timeline. Soft-deleted
 * records never reach the UI and the keys stay stable because the record id
 * survives edits.
 */
export function buildGroupTimeline({
  expenses,
  settlements,
}: BuildGroupTimelineInput): GroupTimelineEntry[] {
  const expenseEntries = expenses
    .filter((expense) => expense.deletedAt === null)
    .map(
      (expense): GroupTimelineEntry => ({
        kind: "expense",
        key: `expense:${expense.id}`,
        expense,
      }),
    );
  const settlementEntries = settlements
    .filter((settlement) => settlement.deletedAt === null)
    .map(
      (settlement): GroupTimelineEntry => ({
        kind: "settlement",
        key: `settlement:${settlement.id}`,
        settlement,
      }),
    );

  return [...expenseEntries, ...settlementEntries].sort(compareTimelineEntries);
}
