import { FirebaseTransactionRepository } from "../repositories/firebase-transaction.repository";
import { TransactionService } from "./transaction.service";

let transactionServiceInstance: TransactionService | null = null;

export function getTransactionService(): TransactionService {
  if (!transactionServiceInstance) {
    const repository = new FirebaseTransactionRepository();
    transactionServiceInstance = new TransactionService(repository);
  }

  return transactionServiceInstance;
}
