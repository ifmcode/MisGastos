import { EmptyFriendLedgerRepository } from "../repositories/friend-ledger.repository";
import { FirebaseFriendsRepository } from "../repositories/firebase-friends.repository";
import { FriendsService } from "./friends.service";

let friendsServiceInstance: FriendsService | null = null;

export function getFriendsService(): FriendsService {
  if (!friendsServiceInstance) {
    friendsServiceInstance = new FriendsService(
      new FirebaseFriendsRepository(),
      new EmptyFriendLedgerRepository(),
    );
  }

  return friendsServiceInstance;
}
