import { collection, getDocs, query, where } from "firebase/firestore";

import { db } from "@/lib/firebase";
import { assertServerSnapshot } from "@/shared/lib/local-db/offline-read";

import {
  CreateTransactionDto,
  Transaction,
  UpdateTransactionDto,
} from "../types/transaction.types";
import {
  ITransactionRepository,
  TransactionMutationResult,
} from "./transaction.repository";
import { mapTransactionDocument } from "./transaction.mapper";
import { createTransactionOperation } from "./transaction-create.operation";
import { deleteTransactionOperation } from "./transaction-delete.operation";
import { updateTransactionOperation } from "./transaction-update.operation";

/** Firestore-backed transactions. Write flows live in their own operation files. */
export class FirebaseTransactionRepository implements ITransactionRepository {
  async getTransactions(ownerId: string): Promise<Transaction[]> {
    const transactionsRef = collection(db, "transactions");
    const snapshot = await getDocs(
      query(transactionsRef, where("ownerId", "==", ownerId)),
    );
    assertServerSnapshot(snapshot);

    const transactions: Transaction[] = [];

    for (const document of snapshot.docs) {
      const transaction = mapTransactionDocument(
        document.id,
        document.data() as Record<string, unknown>,
        ownerId,
      );
      // Soft-deleted linked movements keep their audit trail but leave the list.
      if (transaction && transaction.deletedAt === null) {
        transactions.push(transaction);
      }
    }

    return transactions;
  }

  createTransaction(
    ownerId: string,
    dto: CreateTransactionDto,
  ): Promise<TransactionMutationResult> {
    return createTransactionOperation(ownerId, dto);
  }

  updateTransaction(
    ownerId: string,
    transactionId: string,
    dto: UpdateTransactionDto,
  ): Promise<TransactionMutationResult> {
    return updateTransactionOperation({ ownerId, transactionId, dto });
  }

  deleteTransaction(
    ownerId: string,
    transactionId: string,
  ): Promise<TransactionMutationResult> {
    return deleteTransactionOperation(ownerId, transactionId);
  }
}
