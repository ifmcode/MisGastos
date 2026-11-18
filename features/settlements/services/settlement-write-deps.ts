import type { IFriendLedgerRepository } from "@/features/friends/repositories/friend-ledger.repository";
import type { IFriendsRepository } from "@/features/friends/repositories/friends.repository";

import type { ISettlementsRepository } from "../repositories/settlements.repository";

/**
 * Dependencies of the settlement use cases. The ledger is the composed seam
 * (`sharedExpenses` + `settlements`), so the debt bound sees every source.
 */
export interface SettlementWriteDeps {
  repository: ISettlementsRepository;
  friendsRepository: IFriendsRepository;
  ledgerRepository: IFriendLedgerRepository;
}
