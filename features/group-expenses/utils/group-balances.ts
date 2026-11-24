import type { CurrencyCode } from "@/shared/constants/currencies";

import type {
  GroupBalances,
  GroupCurrencyBalances,
  GroupSettlementLedgerEntry,
  ViewerGroupBalance,
} from "../types/group-balance.types";
import type { GroupExpense } from "../types/group-expense.types";
import { buildDirectGroupDebts } from "./group-balance-debts";
import { compareGroupCurrencies, compareGroupText, toCents } from "./group-balance-order";
import { simplifyGroupDebts } from "./group-balance-simplify";
import { filterActiveGroupExpenses } from "./group-expense-ledger";

export { buildDirectGroupDebts, simplifyGroupDebts };

type CurrencyNets = Map<CurrencyCode, Map<string, number>>;

function addNet(
  totals: CurrencyNets,
  currency: CurrencyCode,
  userId: string,
  deltaCents: number,
): void {
  const perUser = totals.get(currency) ?? new Map<string, number>();
  perUser.set(userId, (perUser.get(userId) ?? 0) + deltaCents);
  totals.set(currency, perUser);
}

/**
 * `net = sum(amountPaid) - sum(shareCents)` per member and currency, so the
 * payer nets paid minus its own share (a payer excluded from the participants
 * keeps the whole amount). Settlements move the net from payer to receiver.
 * Soft-deleted records never count; zero nets and empty currencies drop out,
 * and every currency stays separate because V1 never converts.
 */
export function calculateGroupNetBalances(
  expenses: readonly GroupExpense[],
  settlements: readonly GroupSettlementLedgerEntry[],
): GroupCurrencyBalances[] {
  const totals: CurrencyNets = new Map();

  for (const expense of filterActiveGroupExpenses(expenses)) {
    addNet(totals, expense.currency, expense.payerId, toCents(expense.amountCents));

    for (const participant of expense.participants) {
      addNet(
        totals,
        expense.currency,
        participant.userId,
        -toCents(participant.shareCents),
      );
    }
  }

  for (const entry of settlements) {
    // `""` counts as deleted, matching the expense filter: a blank stamp is not
    // a live record.
    if (entry.deletedAt !== null) continue;

    // The payer already paid the receiver: their debt shrinks and the creditor
    // receivable drops. Emitting the stored direction would double the debt
    // (see `buildSettlementLedgerEntries` for the same reasoning 1:1).
    addNet(totals, entry.currency, entry.fromUserId, toCents(entry.amountCents));
    addNet(totals, entry.currency, entry.toUserId, -toCents(entry.amountCents));
  }

  return [...totals.entries()]
    .map(([currency, perUser]) => ({
      currency,
      balances: [...perUser.entries()]
        .map(([userId, netCents]) => ({ userId, netCents }))
        .filter((balance) => balance.netCents !== 0)
        .sort((left, right) => compareGroupText(left.userId, right.userId)),
    }))
    .filter((currencyBalances) => currencyBalances.balances.length > 0)
    .sort((left, right) => compareGroupCurrencies(left.currency, right.currency));
}

/**
 * Raw nets plus the transfer view. The toggle only picks the suggestion:
 * `true` renders the simplified transfers, `false` the direct expense debts.
 */
export function calculateGroupBalances(
  expenses: readonly GroupExpense[],
  settlements: readonly GroupSettlementLedgerEntry[],
  simplifyDebts: boolean,
): GroupBalances {
  const currencies = calculateGroupNetBalances(expenses, settlements);

  return {
    currencies,
    debts: simplifyDebts
      ? simplifyGroupDebts(currencies)
      : buildDirectGroupDebts(expenses, settlements),
    simplifyDebts,
  };
}

/**
 * The member's non-zero nets per currency, zero lines dropped (empty =
 * settled). Shared by the group balance view and TICKET-068's guard, so both
 * read the same engine output.
 */
export function getMemberNetBalances(
  currencies: readonly GroupCurrencyBalances[],
  memberId: string,
): ViewerGroupBalance[] {
  const member = typeof memberId === "string" ? memberId.trim() : "";
  if (member.length === 0) return [];

  return currencies.flatMap((currencyBalances) =>
    currencyBalances.balances
      .filter((balance) => balance.userId === member && balance.netCents !== 0)
      .map((balance) => ({
        currency: currencyBalances.currency,
        netCents: balance.netCents,
      })),
  );
}

/** The viewer's nets per currency, zero lines dropped (empty = settled). */
export function getViewerGroupBalance(
  balances: GroupBalances,
  viewerUid: string,
): ViewerGroupBalance[] {
  return getMemberNetBalances(balances.currencies, viewerUid);
}
