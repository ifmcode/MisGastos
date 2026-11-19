import type { FriendLedgerEntry } from "@/features/friends/types/friend.types";
import { calculateFriendBalances } from "@/features/friends/utils/friend-balance";
import type { Settlement } from "@/features/settlements/types/settlement.types";
import {
  buildSettlementLedgerEntries,
  filterActiveSettlements,
} from "@/features/settlements/utils/settlement-ledger";
import type { SharedExpense } from "@/features/shared-expenses/types/shared-expense.types";
import {
  buildExpenseLedgerEntries,
  filterActiveExpenses,
} from "@/features/shared-expenses/utils/expense-ledger";

import {
  buildFriendTimeline,
  type FriendTimelineEntry,
} from "./friend-timeline";

/** Both lists belong to the pair already; soft-deleted rows are dropped here. */
export interface FriendSettledBoundaryInput {
  expenses: readonly SharedExpense[];
  settlements: readonly Settlement[];
  viewerUid: string;
  friendUid: string;
}

export interface FriendTimelineGroups {
  /** Entries created after the boundary: the open cycle, always visible. */
  current: FriendTimelineEntry[];
  /** Entries created at or before the boundary; hidden until expanded. */
  settled: FriendTimelineEntry[];
  /** Latest settlement that left the pair at zero in every currency. */
  boundary: Settlement | null;
}

/**
 * Oldest write first, then id: the replay follows creation order. The local
 * ascending comparator is intentional; `sortSettlements` is descending for the
 * UI and must not be reused here.
 */
function compareByCreatedAt(left: Settlement, right: Settlement): number {
  if (left.createdAt !== right.createdAt) {
    return left.createdAt < right.createdAt ? -1 : 1;
  }

  return left.id.localeCompare(right.id);
}

/** Active ledger (both directions of the pair) written up to `createdAt`. */
function buildLedgerUpTo(
  expenses: readonly SharedExpense[],
  settlements: readonly Settlement[],
  createdAt: string,
): FriendLedgerEntry[] {
  // Both builders already drop soft-deleted rows; the subset filter only keeps
  // the replay readable.
  return [
    ...buildExpenseLedgerEntries(
      expenses.filter((expense) => expense.createdAt <= createdAt),
    ),
    ...buildSettlementLedgerEntries(
      settlements.filter((settlement) => settlement.createdAt <= createdAt),
    ),
  ];
}

/**
 * Latest settlement that cleared the pair at its own creation time. The record
 * stores no "full" flag, so each settlement replays the active ledger up to its
 * `createdAt` and checks the same fold the balances use. A partial settlement, or
 * one that clears a single currency, never becomes a boundary.
 *
 * Cost is O(settlements × records); pair histories are small, so the simple
 * replay beats caching per-record folds.
 */
export function findSettlingSettlement({
  expenses,
  settlements,
  viewerUid,
  friendUid,
}: FriendSettledBoundaryInput): Settlement | null {
  const viewer = viewerUid.trim();
  const friend = friendUid.trim();

  if (viewer.length === 0 || friend.length === 0 || viewer === friend) {
    return null;
  }

  const activeExpenses = filterActiveExpenses(expenses);
  const orderedSettlements = [...filterActiveSettlements(settlements)].sort(
    compareByCreatedAt,
  );
  let boundary: Settlement | null = null;

  for (const settlement of orderedSettlements) {
    const ledger = buildLedgerUpTo(
      activeExpenses,
      orderedSettlements,
      settlement.createdAt,
    );

    if (calculateFriendBalances(ledger, viewer, friend).length === 0) {
      boundary = settlement;
    }
  }

  return boundary;
}

/**
 * Splits the flat pair history at the settled boundary. The boundary is a
 * `createdAt` cut, not the expense `date`: a settlement cancels the debt that
 * existed when it was written, so a past-dated new expense stays current.
 *
 * Each group keeps the date order of `buildFriendTimeline`, so an expanded
 * settled block can show days newer than the current block above it. That is
 * the trade-off of cutting by write time, not a sort bug.
 */
export function buildFriendTimelineGroups(
  input: FriendSettledBoundaryInput,
): FriendTimelineGroups {
  const entries = buildFriendTimeline({
    expenses: input.expenses,
    settlements: input.settlements,
  });
  const boundary = findSettlingSettlement(input);

  if (!boundary) {
    return { current: entries, settled: [], boundary: null };
  }

  return {
    current: entries.filter((entry) => entry.createdAt > boundary.createdAt),
    settled: entries.filter((entry) => entry.createdAt <= boundary.createdAt),
    boundary,
  };
}
