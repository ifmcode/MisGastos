import { FirebaseCategoryRepository } from "@/features/categories/repositories/firebase-category.repository";
import { isOfflineFirstEnabled } from "@/shared/lib/local-db/offline-first.flag";

import { CachedTransactionRepository } from "../repositories/cached-transaction.repository";
import { FirebaseTransactionRepository } from "../repositories/firebase-transaction.repository";
import { TransactionService } from "./transaction.service";

let transactionServiceInstance: TransactionService | null = null;

export function getTransactionService(): TransactionService {
  if (!transactionServiceInstance) {
    const remote = new FirebaseTransactionRepository();
    const repository = isOfflineFirstEnabled()
      ? new CachedTransactionRepository(remote)
      : remote;
    // Category validation is a single-record read, so it stays remote.
    const categoryRepository = new FirebaseCategoryRepository();
    transactionServiceInstance = new TransactionService(
      repository,
      categoryRepository,
    );
  }

  return transactionServiceInstance;
}
