import { SharedExpenseLedgerRepository } from "@/features/shared-expenses/repositories/shared-expense-ledger.repository";

import { FirebaseFriendsRepository } from "../repositories/firebase-friends.repository";
import { FriendsService } from "./friends.service";

let friendsServiceInstance: FriendsService | null = null;

export function getFriendsService(): FriendsService {
  if (!friendsServiceInstance) {
    friendsServiceInstance = new FriendsService(
      new FirebaseFriendsRepository(),
      new SharedExpenseLedgerRepository(),
    );
  }

  return friendsServiceInstance;
}
