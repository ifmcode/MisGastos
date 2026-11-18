import { FirebaseFriendsRepository } from "../repositories/firebase-friends.repository";
import { getFriendLedgerRepository } from "../repositories/friend-ledger.factory";
import { FriendsService } from "./friends.service";

let friendsServiceInstance: FriendsService | null = null;

export function getFriendsService(): FriendsService {
  if (!friendsServiceInstance) {
    friendsServiceInstance = new FriendsService(
      new FirebaseFriendsRepository(),
      getFriendLedgerRepository(),
    );
  }

  return friendsServiceInstance;
}
