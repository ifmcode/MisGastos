import {
  CreateTransactionDto,
  Transaction,
  UpdateTransactionDto,
} from "../types/transaction.types";
import {
  cacheTransaction,
  cacheTransactions,
  readCachedTransactions,
} from "./local-transaction.cache";
import {
  ITransactionRepository,
  TransactionMutationResult,
} from "./transaction.repository";

/**
 * Read-through transaction repository. Every method delegates to the remote
 * implementation; the list read mirrors the collection and each successful
 * mutation mirrors its single record. Cache failures never fail the online
 * operation.
 */
export class CachedTransactionRepository implements ITransactionRepository {
  constructor(private readonly remote: ITransactionRepository) {}

  async getTransactions(ownerId: string): Promise<Transaction[]> {
    const transactions = await this.remote.getTransactions(ownerId);

    try {
      await cacheTransactions(
        ownerId,
        transactions,
        new Date().toISOString(),
      );
    } catch {
      // Best effort: the online read already succeeded.
      return transactions;
    }

    // Pending local rows are not on the server yet: return the merged cache so
    // a movement created offline does not disappear behind a stale SDK read.
    return (await readCachedTransactions(ownerId)) ?? transactions;
  }

  async createTransaction(
    ownerId: string,
    dto: CreateTransactionDto,
  ): Promise<TransactionMutationResult> {
    const result = await this.remote.createTransaction(ownerId, dto);
    await this.mirrorSingle(ownerId, result.transaction);
    return result;
  }

  async updateTransaction(
    ownerId: string,
    transactionId: string,
    dto: UpdateTransactionDto,
  ): Promise<TransactionMutationResult> {
    const result = await this.remote.updateTransaction(
      ownerId,
      transactionId,
      dto,
    );
    await this.mirrorSingle(ownerId, result.transaction);
    return result;
  }

  async deleteTransaction(
    ownerId: string,
    transactionId: string,
  ): Promise<TransactionMutationResult> {
    const result = await this.remote.deleteTransaction(ownerId, transactionId);
    // The delete result carries `deletedAt`; the cached read filters it out, so
    // there is no physical removal to schedule here.
    await this.mirrorSingle(ownerId, result.transaction);
    return result;
  }

  private async mirrorSingle(
    ownerId: string,
    transaction: Transaction,
  ): Promise<void> {
    try {
      await cacheTransaction(ownerId, transaction, new Date().toISOString());
    } catch {
      // Best effort: the online mutation already succeeded.
    }
  }
}
