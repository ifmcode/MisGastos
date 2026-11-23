import type { CurrencyCode } from "@/shared/constants/currencies";

import type {
  GroupDebt,
  GroupSettlementLedgerEntry,
} from "../types/group-balance.types";
import type { GroupExpense } from "../types/group-expense.types";
import {
  compareGroupText,
  sortGroupDebts,
  toCents,
} from "./group-balance-order";
import { buildGroupExpenseLedgerEntries } from "./group-expense-ledger";

interface PairEdge {
  currency: CurrencyCode;
  fromUserId: string;
  toUserId: string;
  amountCents: number;
}

interface PairFold {
  currency: CurrencyCode;
  firstUserId: string;
  secondUserId: string;
  netCents: number;
}

function toDebt(pair: PairFold): GroupDebt {
  const owesFirst = pair.netCents > 0;

  return {
    currency: pair.currency,
    fromUserId: owesFirst ? pair.firstUserId : pair.secondUserId,
    toUserId: owesFirst ? pair.secondUserId : pair.firstUserId,
    amountCents: Math.abs(pair.netCents),
  };
}

/** Folds both directions of a pair into one signed amount; zero drops out. */
function foldPairEdges(edges: readonly PairEdge[]): GroupDebt[] {
  const pairs = new Map<string, PairFold>();

  for (const edge of edges) {
    const amountCents = toCents(edge.amountCents);
    if (amountCents === 0 || edge.fromUserId === edge.toUserId) continue;

    const forward = compareGroupText(edge.fromUserId, edge.toUserId) < 0;
    const firstUserId = forward ? edge.fromUserId : edge.toUserId;
    const secondUserId = forward ? edge.toUserId : edge.fromUserId;
    const key = `${edge.currency}\u0000${firstUserId}\u0000${secondUserId}`;
    const current = pairs.get(key);

    if (!current) {
      pairs.set(key, {
        currency: edge.currency,
        firstUserId,
        secondUserId,
        netCents: forward ? amountCents : -amountCents,
      });
      continue;
    }

    current.netCents += forward ? amountCents : -amountCents;
  }

  return sortGroupDebts(
    [...pairs.values()].filter((pair) => pair.netCents !== 0).map(toDebt),
  );
}

/**
 * Pair-level "who owes whom" before simplification: the expense rows (debtor
 * owes payer) plus the reverse edge of every active settlement, so a payment
 * cancels the debt it settles. Each pair keeps one row with the positive net.
 */
export function buildDirectGroupDebts(
  expenses: readonly GroupExpense[],
  settlements: readonly GroupSettlementLedgerEntry[],
): GroupDebt[] {
  const edges: PairEdge[] = buildGroupExpenseLedgerEntries(expenses).map(
    (entry) => ({
      currency: entry.currency,
      fromUserId: entry.fromUserId,
      toUserId: entry.toUserId,
      amountCents: entry.amountCents,
    }),
  );

  for (const entry of settlements) {
    if (entry.deletedAt !== null) continue;

    edges.push({
      currency: entry.currency,
      fromUserId: entry.toUserId,
      toUserId: entry.fromUserId,
      amountCents: entry.amountCents,
    });
  }

  return foldPairEdges(edges);
}
