import type { CurrencyCode } from "@/shared/constants/currencies";

import type { FriendBalance, FriendLedgerEntry } from "../types/friend.types";

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

// EUR first (the default currency), then the code ascending: a deterministic
// order that does not depend on the device locale.
function compareBalances(left: FriendBalance, right: FriendBalance): number {
  if (left.currency === right.currency) return 0;
  if (left.currency === "EUR") return -1;
  if (right.currency === "EUR") return 1;

  return left.currency < right.currency ? -1 : 1;
}

/**
 * Folds the ledger of one pair per currency. Currencies are never converted nor
 * summed together, so a EUR debt and a USD debt stay two separate lines.
 * Positive means the friend owes the viewer; negative means the viewer owes.
 * Settled currencies are dropped so the UI can render one line per real debt.
 */
export function calculateFriendBalances(
  entries: readonly FriendLedgerEntry[],
  viewerUid: string,
  friendUid: string,
): FriendBalance[] {
  const totals = new Map<CurrencyCode, number>();

  for (const entry of filterFriendLedgerEntries(entries, viewerUid, friendUid)) {
    const amount = toCents(entry.amountCents);
    const current = totals.get(entry.currency) ?? 0;

    totals.set(
      entry.currency,
      entry.fromUserId === friendUid ? current + amount : current - amount,
    );
  }

  return Array.from(totals, ([currency, netBalanceCents]) => ({
    currency,
    netBalanceCents,
  }))
    .filter((balance) => balance.netBalanceCents !== 0)
    .sort(compareBalances);
}

export function getFriendBalanceDirection(
  netBalanceCents: number,
): FriendBalanceDirection {
  if (netBalanceCents > 0) return "friend-owes-viewer";
  if (netBalanceCents < 0) return "viewer-owes-friend";
  return "settled";
}
