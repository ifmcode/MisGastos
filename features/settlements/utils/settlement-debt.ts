import type { CurrencyCode } from "@/shared/constants/currencies";
import type {
  FriendBalance,
} from "@/features/friends/types/friend.types";

import type {
  Settlement,
  SettlementDirection,
  SettlementParticipants,
} from "../types/settlement.types";

function toCents(value: number): number {
  return Number.isFinite(value) ? Math.round(value) : 0;
}

/**
 * `FriendBalance.netBalanceCents` is positive when the friend owes the viewer.
 * The settlement screen never lets the user pick a direction: it is this sign.
 */
export function getSettlementDirection(
  netBalanceCents: number,
): SettlementDirection {
  if (netBalanceCents > 0) return "friend-owes-viewer";
  if (netBalanceCents < 0) return "viewer-owes-friend";

  return "settled";
}

/**
 * Resolves who pays and who receives for the current debt of one currency.
 * When nothing is owed there is no settlement to apply, so it returns null.
 */
export function getSettlementDebtorCreditor({
  viewerUid,
  friendUid,
  netBalanceCents,
}: {
  viewerUid: string;
  friendUid: string;
  netBalanceCents: number;
}): SettlementParticipants | null {
  const direction = getSettlementDirection(toCents(netBalanceCents));

  if (direction === "settled") return null;

  const viewerIsCreditor = direction === "friend-owes-viewer";

  return {
    fromUserId: viewerIsCreditor ? friendUid : viewerUid,
    toUserId: viewerIsCreditor ? viewerUid : friendUid,
    viewerIsCreditor,
  };
}

/**
 * Signed net of one currency. Positive means the friend owes the viewer, which
 * keeps the same convention as `calculateFriendBalances`. Missing currencies
 * and malformed values resolve to 0, so they cannot create a fake debt.
 */
export function getCurrencyNetBalanceCents(
  balances: readonly FriendBalance[],
  currency: CurrencyCode,
): number {
  const balance = balances.find((item) => item.currency === currency);

  return balance ? toCents(balance.netBalanceCents) : 0;
}

/** Outstanding debt of one currency, always positive; 0 when it is settled. */
export function getOutstandingDebtCents(
  balances: readonly FriendBalance[],
  currency: CurrencyCode,
): number {
  return Math.abs(getCurrencyNetBalanceCents(balances, currency));
}

/**
 * A settlement can pay part of the debt or all of it, never more and never
 * zero. Both values are integer cents, so the comparison is exact.
 */
export function isAmountWithinDebt(
  amountCents: number,
  debtCents: number,
): boolean {
  const amount = toCents(amountCents);
  const debt = toCents(debtCents);

  return amount > 0 && debt > 0 && amount <= debt;
}

/**
 * The amount is locked only when the other participant (the creditor) already
 * linked an income movement: that movement lives in their wallet and only they
 * can revert it, so the debtor cannot resize it behind their back.
 */
export function canEditSettlementAmount(
  settlement: Settlement,
  viewerUid: string,
): boolean {
  if (settlement.toUserId === viewerUid) return true;

  return settlement.receiverTransactionId === null;
}

/** `Friend.balances` drops settled currencies, so an empty list means settled. */
export function isPairFullySettled(balances: readonly FriendBalance[]): boolean {
  return balances.length === 0;
}

/**
 * True when settling `amountCents` of `currency` leaves the whole pair at zero
 * in every currency. Other currencies must not exist at all, because the fold
 * already drops the settled ones.
 */
export function isSettlementFull(
  balances: readonly FriendBalance[],
  currency: CurrencyCode,
  amountCents: number,
): boolean {
  const amount = toCents(amountCents);
  const net = getCurrencyNetBalanceCents(balances, currency);

  if (amount <= 0 || net === 0) return false;
  if (balances.some((balance) => balance.currency !== currency)) return false;

  return net > 0 ? net - amount === 0 : net + amount === 0;
}
