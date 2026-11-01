import { FirebaseCategoryRepository } from "@/features/categories/repositories/firebase-category.repository";

import { FirebaseTransactionRepository } from "../repositories/firebase-transaction.repository";
import { TransactionService } from "./transaction.service";

let transactionServiceInstance: TransactionService | null = null;

export function getTransactionService(): TransactionService {
  if (!transactionServiceInstance) {
    const repository = new FirebaseTransactionRepository();
    const categoryRepository = new FirebaseCategoryRepository();
    transactionServiceInstance = new TransactionService(
      repository,
      categoryRepository,
    );
  }

  return transactionServiceInstance;
}
