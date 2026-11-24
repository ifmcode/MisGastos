import { toLocalIsoDate } from "@/shared/utils/date";

import type { GroupExpense } from "@/features/group-expenses/types/group-expense.types";
import type { GroupSettlement } from "@/features/group-expenses/types/group-settlement.types";

import type { GroupActivity } from "../types/group-activity.types";

/** One row of the merged **Actividad del grupo** register. */
export type GroupActivityEntry =
  | { kind: "expense"; key: string; sortAt: string; expense: GroupExpense }
  | {
      kind: "settlement";
      key: string;
      sortAt: string;
      settlement: GroupSettlement;
    }
  | { kind: "event"; key: string; sortAt: string; activity: GroupActivity };

export interface BuildGroupActivityEntriesInput {
  /** Current documents; soft-deleted rows are dropped defensively. */
  expenses: readonly GroupExpense[];
  settlements: readonly GroupSettlement[];
  /** Activity page: creation events are dropped, the rest are kept. */
  activities: readonly GroupActivity[];
}

const CREATION_EVENTS: ReadonlySet<string> = new Set([
  "expense-created",
  "settlement-created",
]);

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Newest activity first, then key ascending: deterministic on ties. */
function compareEntries(
  left: GroupActivityEntry,
  right: GroupActivityEntry,
): number {
  if (left.sortAt !== right.sortAt) {
    return left.sortAt > right.sortAt ? -1 : 1;
  }

  if (left.key === right.key) return 0;

  return left.key < right.key ? -1 : 1;
}

function isActiveRecord(deletedAt: string | null): boolean {
  return deletedAt === null || deletedAt.length === 0;
}

/**
 * Merged register of the group: every active expense and settlement appears
 * once as its rich record row, while the activity feed contributes edits,
 * deletions, membership, ownership and settings entries. Creation events are
 * skipped because the record itself is the row, so nothing is duplicated and
 * legacy records without a stored event are never hidden.
 */
export function buildGroupActivityEntries({
  expenses,
  settlements,
  activities,
}: BuildGroupActivityEntriesInput): GroupActivityEntry[] {
  const records: GroupActivityEntry[] = [];
  const events: GroupActivityEntry[] = [];

  for (const expense of expenses) {
    if (!isActiveRecord(expense.deletedAt)) continue;

    records.push({
      kind: "expense",
      key: `expense:${expense.id}`,
      sortAt: expense.createdAt,
      expense,
    });
  }

  for (const settlement of settlements) {
    if (!isActiveRecord(settlement.deletedAt)) continue;

    records.push({
      kind: "settlement",
      key: `settlement:${settlement.id}`,
      sortAt: settlement.createdAt,
      settlement,
    });
  }

  for (const activity of activities) {
    if (CREATION_EVENTS.has(activity.type)) continue;

    events.push({
      kind: "event",
      key: `activity:${activity.id}`,
      sortAt: activity.createdAt,
      activity,
    });
  }

  return [...records, ...events].sort(compareEntries);
}

/**
 * Local calendar day of an activity instant, used by the row gutter. A date-only
 * value is already a calendar day; an unparseable value is returned untouched.
 */
export function getGroupActivityEntryDate(sortAt: string): string {
  if (ISO_DATE_PATTERN.test(sortAt)) return sortAt;

  const date = new Date(sortAt);
  if (Number.isNaN(date.getTime())) return sortAt;

  return toLocalIsoDate(date) ?? sortAt;
}
