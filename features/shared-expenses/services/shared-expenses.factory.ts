import { CachedCategoryRepository } from "@/features/categories/repositories/cached-category.repository";
import { FirebaseCategoryRepository } from "@/features/categories/repositories/firebase-category.repository";
import { CachedFriendsRepository } from "@/features/friends/repositories/cached-friends.repository";
import { FirebaseFriendsRepository } from "@/features/friends/repositories/firebase-friends.repository";
import { isOfflineFirstEnabled } from "@/shared/lib/local-db/offline-first.flag";

import { CachedSharedExpensesRepository } from "../repositories/cached-shared-expenses.repository";
import { FirebaseSharedExpensesRepository } from "../repositories/firebase-shared-expenses.repository";
import { OfflineSharedExpensesRepository } from "../repositories/offline-shared-expenses.repository";
import { SharedExpensesService } from "./shared-expenses.service";

let sharedExpensesServiceInstance: SharedExpensesService | null = null;

export function getSharedExpensesService(): SharedExpensesService {
  if (!sharedExpensesServiceInstance) {
    // The same instance serves the social and the linked paths.
    const offline = isOfflineFirstEnabled();
    const remote = new FirebaseSharedExpensesRepository();
    const expensesRepository = offline
      ? new OfflineSharedExpensesRepository(
          new CachedSharedExpensesRepository(remote),
        )
      : remote;
    const friendsRepository = offline
      ? new CachedFriendsRepository(new FirebaseFriendsRepository())
      : new FirebaseFriendsRepository();
    const categoryRepository = offline
      ? new CachedCategoryRepository(new FirebaseCategoryRepository())
      : new FirebaseCategoryRepository();

    sharedExpensesServiceInstance = new SharedExpensesService(
      expensesRepository,
      friendsRepository,
      expensesRepository,
      categoryRepository,
    );
  }

  return sharedExpensesServiceInstance;
}
