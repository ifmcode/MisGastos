import type { GroupSettlement } from "../types/group-settlement.types";

/**
 * Newest payment day first, then newest write, then id ascending: the same
 * stable order as the group expense list, so the audit trail never jumps.
 */
export function sortGroupSettlements(
  settlements: readonly GroupSettlement[],
): GroupSettlement[] {
  return [...settlements].sort((left, right) => {
    if (left.date !== right.date) return left.date < right.date ? 1 : -1;
    if (left.createdAt !== right.createdAt) {
      return left.createdAt < right.createdAt ? 1 : -1;
    }

    return left.id < right.id ? -1 : 1;
  });
}
