import { isOfflineFirstEnabled } from "@/shared/lib/local-db/offline-first.flag";

import { CachedFriendsRepository } from "../repositories/cached-friends.repository";
import { FirebaseFriendsRepository } from "../repositories/firebase-friends.repository";
import { getFriendLedgerRepository } from "../repositories/friend-ledger.factory";
import { FriendsService } from "./friends.service";

let friendsServiceInstance: FriendsService | null = null;

export function getFriendsService(): FriendsService {
  if (!friendsServiceInstance) {
    const repository = isOfflineFirstEnabled()
      ? new CachedFriendsRepository(new FirebaseFriendsRepository())
      : new FirebaseFriendsRepository();

    friendsServiceInstance = new FriendsService(
      repository,
      getFriendLedgerRepository(),
    );
  }

  return friendsServiceInstance;
}
