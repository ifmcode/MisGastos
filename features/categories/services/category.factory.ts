import { isOfflineFirstEnabled } from "@/shared/lib/local-db/offline-first.flag";

import { CachedCategoryRepository } from "../repositories/cached-category.repository";
import { FirebaseCategoryRepository } from "../repositories/firebase-category.repository";
import { CategoryService } from "./category.service";

let categoryServiceInstance: CategoryService | null = null;

export function getCategoryService(): CategoryService {
  if (!categoryServiceInstance) {
    const remote = new FirebaseCategoryRepository();
    const repository = isOfflineFirstEnabled()
      ? new CachedCategoryRepository(remote)
      : remote;
    categoryServiceInstance = new CategoryService(repository);
  }

  return categoryServiceInstance;
}
