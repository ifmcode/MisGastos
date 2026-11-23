import type { Href } from "expo-router";

import type { Transaction } from "../types/transaction.types";

/**
 * Social route a linked movement opens, or `null` when it is a personal one.
 * Linked movements belong to their social record: the personal detail (and its
 * edit/delete actions) must never open for them. Settlements keep the first
 * place because a settlement income is also a movement of an owned wallet.
 */
export function getTransactionDetailTarget(
  transaction: Transaction,
): Href | null {
  if (transaction.settlementId) {
    return `/social/settlements/${transaction.settlementId}` as Href;
  }

  if (transaction.sharedExpenseId) {
    return `/social/expenses/${transaction.sharedExpenseId}` as Href;
  }

  if (transaction.groupExpenseId) {
    return `/social/group-expenses/${transaction.groupExpenseId}` as Href;
  }

  if (transaction.groupSettlementId) {
    // The group settlement detail route ships with TICKET-010 Phase C; the
    // movement must never fall back to the personal detail and expose an edit.
    return `/social/group-settlements/${transaction.groupSettlementId}` as Href;
  }

  return null;
}
