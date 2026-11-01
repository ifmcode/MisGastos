import { ICategoryRepository } from "@/features/categories/repositories/category.repository";

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
  constructor(
    private readonly repository: ITransactionRepository,
    private readonly categoryRepository: ICategoryRepository,
  ) {}

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

    await this.ensureCategory(
      normalizedOwnerId,
      validation.value.categoryId,
      validation.value.type,
    );

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

    await this.ensureCategory(
      normalizedOwnerId,
      validation.value.categoryId,
      validation.value.type,
    );

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

  /** Ensures the category belongs to the owner and matches the movement type. */
  private async ensureCategory(
    ownerId: string,
    categoryId: string,
    type: string,
  ): Promise<void> {
    const category = await this.categoryRepository.getCategory(
      ownerId,
      categoryId,
    );

    if (!category) {
      throw new TransactionOperationError("CATEGORY_NOT_FOUND");
    }

    if (category.type !== type) {
      throw new TransactionOperationError("CATEGORY_TYPE_MISMATCH");
    }
  }
}
