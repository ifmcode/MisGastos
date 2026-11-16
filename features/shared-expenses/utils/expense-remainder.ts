import type { SharedExpenseParticipant } from "../types/shared-expense.types";

/** Exact share before rounding: the floored cents plus the fraction numerator. */
export interface ExactShare {
  userId: string;
  floorCents: number;
  remainder: number;
  percentageBps?: number;
  weight?: number;
}

/** Participant uids are unique inside a split, so `<` is a total order. */
function compareUserIds(left: string, right: string): number {
  return left < right ? -1 : 1;
}

/**
 * Deterministic largest-remainder distribution: every exact share is floored
 * and the leftover cents go to the biggest fractional remainders, ties broken
 * by `userId` ascending. The input order never changes the result and the
 * shares always add up to `totalCents`.
 */
export function distributeByRemainder(
  totalCents: number,
  shares: readonly ExactShare[],
): SharedExpenseParticipant[] {
  const assigned = shares.reduce((sum, share) => sum + share.floorCents, 0);
  const leftover = Math.max(totalCents - assigned, 0);
  const ranked = shares
    .map((share, index) => ({ index, remainder: share.remainder }))
    .sort(
      (left, right) =>
        right.remainder - left.remainder ||
        compareUserIds(shares[left.index].userId, shares[right.index].userId),
    );
  const extra = new Set(ranked.slice(0, leftover).map((item) => item.index));

  return shares
    .map((share, index) => ({
      userId: share.userId,
      shareCents: share.floorCents + (extra.has(index) ? 1 : 0),
      ...(share.percentageBps === undefined
        ? {}
        : { percentageBps: share.percentageBps }),
      ...(share.weight === undefined ? {} : { weight: share.weight }),
    }))
    .sort((left, right) => compareUserIds(left.userId, right.userId));
}
