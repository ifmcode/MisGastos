import { CachedCategoryRepository } from "@/features/categories/repositories/cached-category.repository";
import { FirebaseCategoryRepository } from "@/features/categories/repositories/firebase-category.repository";
import { isOfflineFirstEnabled } from "@/shared/lib/local-db/offline-first.flag";

import { CachedTransactionRepository } from "../repositories/cached-transaction.repository";
import { FirebaseTransactionRepository } from "../repositories/firebase-transaction.repository";
import { OfflineTransactionRepository } from "../repositories/offline-transaction.repository";
import { TransactionService } from "./transaction.service";

let transactionServiceInstance: TransactionService | null = null;

export function getTransactionService(): TransactionService {
  if (!transactionServiceInstance) {
    const offline = isOfflineFirstEnabled();
    const remote = new FirebaseTransactionRepository();
    const repository = offline
      ? new OfflineTransactionRepository(
          new CachedTransactionRepository(remote),
        )
      : remote;
    // Category validation is a single-record read; offline mode falls back to
    // the cached list when the remote read fails.
    const categoryRepository = offline
      ? new CachedCategoryRepository(new FirebaseCategoryRepository())
      : new FirebaseCategoryRepository();
    transactionServiceInstance = new TransactionService(
      repository,
      categoryRepository,
    );
  }

  return transactionServiceInstance;
}
