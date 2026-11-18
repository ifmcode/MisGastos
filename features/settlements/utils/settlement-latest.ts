import type { Settlement } from "../types/settlement.types";
import { filterActiveSettlements } from "./settlement-ledger";

/** Newest settlement day first, then newest write, then id: a stable order. */
export function sortSettlements(
  settlements: readonly Settlement[],
): Settlement[] {
  return [...settlements].sort((left, right) => {
    if (left.date !== right.date) return left.date < right.date ? 1 : -1;
    if (left.createdAt !== right.createdAt) {
      return left.createdAt < right.createdAt ? 1 : -1;
    }

    return left.id < right.id ? -1 : 1;
  });
}

/**
 * Latest active settlement of a list. Soft-deleted records are gone for the
 * friend detail message even though they stay stored as an audit trail.
 */
export function getLatestSettlement(
  settlements: readonly Settlement[],
): Settlement | null {
  const [latest] = sortSettlements(filterActiveSettlements(settlements));

  return latest ?? null;
}

/** Settlements of one pair, active and soft-deleted, newest first. */
export function getPairSettlements(
  settlements: readonly Settlement[],
  viewerUid: string,
  friendUid: string,
): Settlement[] {
  if (viewerUid.length === 0 || viewerUid === friendUid) return [];

  return sortSettlements(
    settlements.filter(
      (settlement) =>
        settlement.participantIds.includes(viewerUid) &&
        settlement.participantIds.includes(friendUid),
    ),
  );
}
