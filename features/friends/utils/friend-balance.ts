import type { FriendLedgerEntry } from "../types/friend.types";

export type FriendBalanceDirection =
  | "settled"
  | "friend-owes-viewer"
  | "viewer-owes-friend";

/**
 * Ledger amounts are integer cents, so the fold uses exact integer arithmetic.
 * The decimal conversion happens only at the display boundary, through
 * `centsToAmount`.
 */
function toCents(value: number): number {
  return Number.isFinite(value) ? Math.round(value) : 0;
}

/**
 * Converts integer cents to the decimal amount shown to the user. It keeps the
 * cents <-> decimal boundary explicit and settles malformed input at 0.
 */
export function centsToAmount(cents: number): number {
  return toCents(cents) / 100;
}

function isActiveEntry(entry: FriendLedgerEntry): boolean {
  return entry.deletedAt === null || entry.deletedAt.length === 0;
}

function isPairEntry(
  entry: FriendLedgerEntry,
  viewerUid: string,
  friendUid: string,
): boolean {
  return (
    (entry.fromUserId === viewerUid && entry.toUserId === friendUid) ||
    (entry.fromUserId === friendUid && entry.toUserId === viewerUid)
  );
}

/** Keeps the active entries of one pair; deleted records never count. */
export function filterFriendLedgerEntries(
  entries: readonly FriendLedgerEntry[],
  viewerUid: string,
  friendUid: string,
): FriendLedgerEntry[] {
  if (viewerUid.length === 0 || viewerUid === friendUid) return [];

  return entries.filter(
    (entry) => isActiveEntry(entry) && isPairEntry(entry, viewerUid, friendUid),
  );
}

/**
 * Folds the ledger of one pair into the net balance seen by `viewerUid`.
 * Positive means the friend owes the viewer; negative means the viewer owes.
 */
export function calculateFriendNetBalance(
  entries: readonly FriendLedgerEntry[],
  viewerUid: string,
  friendUid: string,
): number {
  return filterFriendLedgerEntries(entries, viewerUid, friendUid).reduce(
    (total, entry) => {
      const amount = toCents(entry.amountCents);
      return entry.fromUserId === friendUid ? total + amount : total - amount;
    },
    0,
  );
}

export function getFriendBalanceDirection(
  netBalanceCents: number,
): FriendBalanceDirection {
  if (netBalanceCents > 0) return "friend-owes-viewer";
  if (netBalanceCents < 0) return "viewer-owes-friend";
  return "settled";
}
