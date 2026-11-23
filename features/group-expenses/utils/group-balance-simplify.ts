import type {
  GroupCurrencyBalances,
  GroupDebt,
  GroupMemberNetBalance,
} from "../types/group-balance.types";
import {
  compareGroupCurrencies,
  compareGroupText,
  sortGroupDebts,
  toCents,
} from "./group-balance-order";

interface RunningBalance {
  userId: string;
  amountCents: number;
}

/** Largest absolute amount first, ties `userId` ascending. */
function compareRunningBalances(
  left: RunningBalance,
  right: RunningBalance,
): number {
  if (left.amountCents !== right.amountCents) {
    return right.amountCents - left.amountCents;
  }

  return compareGroupText(left.userId, right.userId);
}

function collectRunningBalances(
  balances: readonly GroupMemberNetBalance[],
  kind: "debtor" | "creditor",
): RunningBalance[] {
  return balances
    .filter((balance) =>
      kind === "debtor" ? balance.netCents < 0 : balance.netCents > 0,
    )
    .map((balance) => ({
      userId: balance.userId,
      amountCents: toCents(Math.abs(balance.netCents)),
    }))
    .sort(compareRunningBalances);
}

/**
 * Matches the biggest debtor with the biggest creditor, transfers the minimum
 * and repeats: `n` non-zero balances need at most `n - 1` transfers and nobody
 * pays more than their net.
 */
function simplifyCurrency({
  currency,
  balances,
}: GroupCurrencyBalances): GroupDebt[] {
  const debtors = collectRunningBalances(balances, "debtor");
  const creditors = collectRunningBalances(balances, "creditor");
  const debts: GroupDebt[] = [];
  let debtorIndex = 0;
  let creditorIndex = 0;

  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex];
    const creditor = creditors[creditorIndex];
    const amountCents = Math.min(debtor.amountCents, creditor.amountCents);

    debts.push({
      currency,
      fromUserId: debtor.userId,
      toUserId: creditor.userId,
      amountCents,
    });

    debtor.amountCents -= amountCents;
    creditor.amountCents -= amountCents;
    if (debtor.amountCents === 0) debtorIndex += 1;
    if (creditor.amountCents === 0) creditorIndex += 1;
  }

  return debts;
}

/** Simplified suggestions per currency, deterministic and never converted. */
export function simplifyGroupDebts(
  netBalances: readonly GroupCurrencyBalances[],
): GroupDebt[] {
  const debts = [...netBalances]
    .sort((left, right) => compareGroupCurrencies(left.currency, right.currency))
    .flatMap(simplifyCurrency);

  return sortGroupDebts(debts);
}
