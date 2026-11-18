import { FirebaseFriendsRepository } from "@/features/friends/repositories/firebase-friends.repository";
import { getFriendLedgerRepository } from "@/features/friends/repositories/friend-ledger.factory";

import { FirebaseSettlementsRepository } from "../repositories/firebase-settlements.repository";
import { SettlementsService } from "./settlements.service";

let settlementsServiceInstance: SettlementsService | null = null;

export function getSettlementsService(): SettlementsService {
  if (!settlementsServiceInstance) {
    settlementsServiceInstance = new SettlementsService(
      new FirebaseSettlementsRepository(),
      new FirebaseFriendsRepository(),
      getFriendLedgerRepository(),
    );
  }

  return settlementsServiceInstance;
}
