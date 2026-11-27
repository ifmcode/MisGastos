import { isOfflineFirstEnabled } from "@/shared/lib/local-db/offline-first.flag";
import { CachedSharedExpensesRepository } from "@/features/shared-expenses/repositories/cached-shared-expenses.repository";
import { FirebaseSharedExpensesRepository } from "@/features/shared-expenses/repositories/firebase-shared-expenses.repository";
import { SharedExpenseLedgerRepository } from "@/features/shared-expenses/repositories/shared-expense-ledger.repository";
import { CachedSettlementsRepository } from "@/features/settlements/repositories/cached-settlements.repository";
import { FirebaseSettlementsRepository } from "@/features/settlements/repositories/firebase-settlements.repository";
import { SettlementLedgerRepository } from "@/features/settlements/repositories/settlement-ledger.repository";

import { ComposedFriendLedgerRepository } from "./composed-friend-ledger.repository";
import type { IFriendLedgerRepository } from "./friend-ledger.repository";

/**
 * Single entry point of the friends ledger. TICKET-046 joins the settlement
 * source with the shared expenses so `FriendsService` keeps one dependency.
 *
 * With offline-first on, both sources are read through the cache, so the
 * friend balances include pending local expenses and settlements.
 *
 * This module only imports repositories; it must never import
 * `features/friends/services/friends.factory` or the settlements service layer,
 * which would create an import cycle.
 */
let friendLedgerRepositoryInstance: IFriendLedgerRepository | null = null;

export function getFriendLedgerRepository(): IFriendLedgerRepository {
  if (!friendLedgerRepositoryInstance) {
    const offline = isOfflineFirstEnabled();
    const sharedExpenses = offline
      ? new CachedSharedExpensesRepository(new FirebaseSharedExpensesRepository())
      : new FirebaseSharedExpensesRepository();
    const settlements = offline
      ? new CachedSettlementsRepository(new FirebaseSettlementsRepository())
      : new FirebaseSettlementsRepository();

    friendLedgerRepositoryInstance = new ComposedFriendLedgerRepository([
      new SharedExpenseLedgerRepository(sharedExpenses),
      new SettlementLedgerRepository(settlements),
    ]);
  }

  return friendLedgerRepositoryInstance;
}
