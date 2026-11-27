import { CachedFriendsRepository } from "@/features/friends/repositories/cached-friends.repository";
import { FirebaseFriendsRepository } from "@/features/friends/repositories/firebase-friends.repository";
import { getFriendLedgerRepository } from "@/features/friends/repositories/friend-ledger.factory";
import { isOfflineFirstEnabled } from "@/shared/lib/local-db/offline-first.flag";

import { CachedSettlementsRepository } from "../repositories/cached-settlements.repository";
import { FirebaseSettlementsRepository } from "../repositories/firebase-settlements.repository";
import { OfflineSettlementsRepository } from "../repositories/offline-settlements.repository";
import { SettlementsService } from "./settlements.service";

let settlementsServiceInstance: SettlementsService | null = null;

export function getSettlementsService(): SettlementsService {
  if (!settlementsServiceInstance) {
    const offline = isOfflineFirstEnabled();
    const remote = new FirebaseSettlementsRepository();
    const repository = offline
      ? new OfflineSettlementsRepository(
          new CachedSettlementsRepository(remote),
        )
      : remote;
    const friendsRepository = offline
      ? new CachedFriendsRepository(new FirebaseFriendsRepository())
      : new FirebaseFriendsRepository();

    settlementsServiceInstance = new SettlementsService(
      repository,
      friendsRepository,
      getFriendLedgerRepository(),
    );
  }

  return settlementsServiceInstance;
}
