import { ITransactionRepository } from "../repositories/transaction.repository";
import {
  TransactionInput,
  TransactionValidationIssue,
  validateTransactionInput,
} from "../schemas/transaction.schema";
import { Transaction } from "../types/transaction.types";
import {
  TransactionOperationError,
  TransactionValidationError,
} from "./transaction.errors";

function ownerIssue(): TransactionValidationIssue {
  return {
    field: "ownerId",
    code: "OWNER_REQUIRED",
    message: "Debes iniciar sesión para gestionar tus movimientos.",
  };
}

export class TransactionService {
  constructor(private readonly repository: ITransactionRepository) {}

  async getTransactions(ownerId: string): Promise<Transaction[]> {
    const normalizedOwnerId = ownerId.trim();

    if (normalizedOwnerId.length === 0) {
      throw new TransactionValidationError([ownerIssue()]);
    }

    return this.repository.getTransactions(normalizedOwnerId);
  }

  async createTransaction(ownerId: string, input: TransactionInput) {
    const normalizedOwnerId = ownerId.trim();
    const issues: TransactionValidationIssue[] = [];
    const validation = validateTransactionInput(input);

    if (normalizedOwnerId.length === 0) {
      issues.push(ownerIssue());
    }

    if (!validation.ok) {
      throw new TransactionValidationError([...issues, ...validation.error]);
    }

    if (issues.length > 0) {
      throw new TransactionValidationError(issues);
    }

    return this.repository.createTransaction(normalizedOwnerId, validation.value);
  }

  async updateTransaction(
    ownerId: string,
    transactionId: string,
    input: TransactionInput,
  ) {
    const normalizedOwnerId = ownerId.trim();
    const normalizedTransactionId = transactionId.trim();
    const issues: TransactionValidationIssue[] = [];
    const validation = validateTransactionInput(input);

    if (normalizedOwnerId.length === 0) {
      issues.push(ownerIssue());
    }

    if (!validation.ok) {
      throw new TransactionValidationError([...issues, ...validation.error]);
    }

    if (issues.length > 0) {
      throw new TransactionValidationError(issues);
    }

    if (normalizedTransactionId.length === 0) {
      throw new TransactionOperationError("TRANSACTION_NOT_FOUND");
    }

    return this.repository.updateTransaction(
      normalizedOwnerId,
      normalizedTransactionId,
      validation.value,
    );
  }

  async deleteTransaction(ownerId: string, transactionId: string) {
    const normalizedOwnerId = ownerId.trim();
    const normalizedTransactionId = transactionId.trim();

    if (normalizedOwnerId.length === 0) {
      throw new TransactionValidationError([ownerIssue()]);
    }

    if (normalizedTransactionId.length === 0) {
      throw new TransactionOperationError("TRANSACTION_NOT_FOUND");
    }

    return this.repository.deleteTransaction(
      normalizedOwnerId,
      normalizedTransactionId,
    );
  }
}
