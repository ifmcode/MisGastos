import type { DatabasePort } from "@/shared/lib/local-db/database.port";
import { getLocalDatabase } from "@/shared/lib/local-db/local-db.runtime";
import { createClientId } from "@/shared/utils/client-id";

import type {
  CreateTransactionDto,
  Transaction,
  UpdateTransactionDto,
} from "../types/transaction.types";
import {
  ITransactionRepository,
  TransactionMutationResult,
} from "./transaction.repository";
import { createOfflineTransaction } from "./offline-transaction.create";
import { deleteOfflineTransaction } from "./offline-transaction.delete";
import { readTransactionRow } from "./offline-transaction.snapshots";
import { updateOfflineTransaction } from "./offline-transaction.update";

export interface OfflineTransactionRepositoryOptions {
  /** Local port provider; defaults to the runtime database. */
  getPort?: () => Promise<DatabasePort | null>;
  now?: () => string;
  createId?: () => string;
}

/**
 * Local-first transaction repository used while `EXPO_PUBLIC_OFFLINE_FIRST` is
 * on. Reads always use the phase-3 repository; mutations write the row and the
 * outbox row in one local transaction and fall back to the remote path when no
 * local port is available or the record is not cached locally.
 */
export class OfflineTransactionRepository implements ITransactionRepository {
  private readonly getPort: () => Promise<DatabasePort | null>;
  private readonly now: () => string;
  private readonly createId: () => string;

  constructor(
    private readonly reader: ITransactionRepository,
    options: OfflineTransactionRepositoryOptions = {},
  ) {
    this.getPort = options.getPort ?? getLocalDatabase;
    this.now = options.now ?? (() => new Date().toISOString());
    this.createId = options.createId ?? createClientId;
  }

  getTransactions(ownerId: string): Promise<Transaction[]> {
    return this.reader.getTransactions(ownerId);
  }

  async createTransaction(
    ownerId: string,
    dto: CreateTransactionDto,
  ): Promise<TransactionMutationResult> {
    const port = await this.getPort();
    if (!port) return this.reader.createTransaction(ownerId, dto);

    return createOfflineTransaction(port, ownerId, dto, this.deps());
  }

  async updateTransaction(
    ownerId: string,
    transactionId: string,
    dto: UpdateTransactionDto,
  ): Promise<TransactionMutationResult> {
    const port = await this.getPort();
    if (!port) {
      return this.reader.updateTransaction(ownerId, transactionId, dto);
    }

    const existing = await readTransactionRow(port, ownerId, transactionId);
    if (!existing) {
      return this.reader.updateTransaction(ownerId, transactionId, dto);
    }

    return updateOfflineTransaction(port, ownerId, transactionId, dto, this.deps());
  }

  async deleteTransaction(
    ownerId: string,
    transactionId: string,
  ): Promise<TransactionMutationResult> {
    const port = await this.getPort();
    if (!port) {
      return this.reader.deleteTransaction(ownerId, transactionId);
    }

    const existing = await readTransactionRow(port, ownerId, transactionId);
    if (!existing) {
      return this.reader.deleteTransaction(ownerId, transactionId);
    }

    return deleteOfflineTransaction(port, ownerId, transactionId, this.deps());
  }

  private deps(): { now: () => string; createId: () => string } {
    return { now: this.now, createId: this.createId };
  }
}
