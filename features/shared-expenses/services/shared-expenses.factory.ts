import { FirebaseCategoryRepository } from "@/features/categories/repositories/firebase-category.repository";
import { FirebaseFriendsRepository } from "@/features/friends/repositories/firebase-friends.repository";

import { FirebaseSharedExpensesRepository } from "../repositories/firebase-shared-expenses.repository";
import { SharedExpensesService } from "./shared-expenses.service";

let sharedExpensesServiceInstance: SharedExpensesService | null = null;

export function getSharedExpensesService(): SharedExpensesService {
  if (!sharedExpensesServiceInstance) {
    // The same instance serves the social and the linked paths.
    const expensesRepository = new FirebaseSharedExpensesRepository();

    sharedExpensesServiceInstance = new SharedExpensesService(
      expensesRepository,
      new FirebaseFriendsRepository(),
      expensesRepository,
      new FirebaseCategoryRepository(),
    );
  }

  return sharedExpensesServiceInstance;
}
