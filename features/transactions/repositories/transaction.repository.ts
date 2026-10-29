import { Wallet } from "@/features/wallets/types/wallet.types";

import {
  CreateTransactionDto,
  Transaction,
  UpdateTransactionDto,
} from "../types/transaction.types";

export interface TransactionMutationResult {
  transaction: Transaction;
  /** Wallets whose balance changed, so callers can refresh their local state. */
  wallets: Wallet[];
}

export interface ITransactionRepository {
  getTransactions(ownerId: string): Promise<Transaction[]>;
  createTransaction(
    ownerId: string,
    dto: CreateTransactionDto,
  ): Promise<TransactionMutationResult>;
  updateTransaction(
    ownerId: string,
    transactionId: string,
    dto: UpdateTransactionDto,
  ): Promise<TransactionMutationResult>;
  deleteTransaction(
    ownerId: string,
    transactionId: string,
  ): Promise<TransactionMutationResult>;
}
