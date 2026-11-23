import type { GroupBalances, GroupDebt } from "../types/group-balance.types";
import type { GroupSettlement } from "../types/group-settlement.types";
import type { GroupSettlementDirection } from "./group-settlement-form.types";

function toCents(value: number): number {
  return Number.isFinite(value) ? Math.round(value) : 0;
}

/**
 * Direct debt of one pair in one currency, or `null` when the pair/currency
 * carries no debt any more. The stored direction is canonical: a stale route
 * param pair that arrives swapped only ever finds the real debtor/creditor, so
 * the form can never settle a different direction than the ledger holds.
 */
export function findGroupSettlementDebt(
  balances: GroupBalances | null,
  currency: string,
  fromUserId: string,
  toUserId: string,
): GroupDebt | null {
  const code = currency.trim();
  const first = fromUserId.trim();
  const second = toUserId.trim();
  if (!balances || code.length === 0 || first.length === 0) return null;
  if (first === second) return null;

  return (
    balances.debts.find(
      (item) =>
        item.currency === code &&
        ((item.fromUserId === first && item.toUserId === second) ||
          (item.fromUserId === second && item.toUserId === first)),
    ) ?? null
  );
}

/** The viewer pays when they are the debtor; `null` when outside the pair. */
export function getGroupSettlementViewerDirection(
  viewerUid: string,
  debt: GroupDebt,
): GroupSettlementDirection | null {
  const viewer = viewerUid.trim();
  if (viewer.length === 0) return null;

  if (debt.fromUserId === viewer) return "viewer-pays";
  if (debt.toUserId === viewer) return "viewer-receives";

  return null;
}

/** `pairDebt` is the live debt including this settlement; add it back. */
export function getGroupSettlementEditBoundCents(
  settlement: GroupSettlement,
  pairDebt: GroupDebt | null,
): number {
  const amount = toCents(settlement.amountCents);
  const sameDirection =
    pairDebt !== null &&
    pairDebt.currency === settlement.currency &&
    pairDebt.fromUserId === settlement.fromUserId &&
    pairDebt.toUserId === settlement.toUserId;

  return sameDirection ? toCents(pairDebt.amountCents) + amount : amount;
}
