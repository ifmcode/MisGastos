import { SharedExpenseLedgerRepository } from "@/features/shared-expenses/repositories/shared-expense-ledger.repository";
import { SettlementLedgerRepository } from "@/features/settlements/repositories/settlement-ledger.repository";

import { ComposedFriendLedgerRepository } from "./composed-friend-ledger.repository";
import type { IFriendLedgerRepository } from "./friend-ledger.repository";

/**
 * Single entry point of the friends ledger. TICKET-046 joins the settlement
 * source with the shared expenses so `FriendsService` keeps one dependency.
 *
 * This module only imports repositories; it must never import
 * `features/friends/services/friends.factory` or the settlements service layer,
 * which would create an import cycle.
 */
let friendLedgerRepositoryInstance: IFriendLedgerRepository | null = null;

export function getFriendLedgerRepository(): IFriendLedgerRepository {
  if (!friendLedgerRepositoryInstance) {
    friendLedgerRepositoryInstance = new ComposedFriendLedgerRepository([
      new SharedExpenseLedgerRepository(),
      new SettlementLedgerRepository(),
    ]);
  }

  return friendLedgerRepositoryInstance;
}
