import { FirebaseFriendsRepository } from "@/features/friends/repositories/firebase-friends.repository";

import { FirebaseSharedExpensesRepository } from "../repositories/firebase-shared-expenses.repository";
import { SharedExpensesService } from "./shared-expenses.service";

let sharedExpensesServiceInstance: SharedExpensesService | null = null;

export function getSharedExpensesService(): SharedExpensesService {
  if (!sharedExpensesServiceInstance) {
    sharedExpensesServiceInstance = new SharedExpensesService(
      new FirebaseSharedExpensesRepository(),
      new FirebaseFriendsRepository(),
    );
  }

  return sharedExpensesServiceInstance;
}
