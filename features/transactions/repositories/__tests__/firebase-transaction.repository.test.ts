import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import {
  mockCollection,
  mockGetDocs,
  mockQuery,
  mockWhere,
  setupTransactionRepositoryMocks,
  transactionDocument,
  validDto,
} from "./transaction-repository.test-helpers";
import { FirebaseTransactionRepository } from "../firebase-transaction.repository";
import { createTransactionOperation } from "../transaction-create.operation";
import { deleteTransactionOperation } from "../transaction-delete.operation";
import { updateTransactionOperation } from "../transaction-update.operation";

jest.mock("../transaction-create.operation", () => ({
  createTransactionOperation: jest.fn(),
}));
jest.mock("../transaction-delete.operation", () => ({
  deleteTransactionOperation: jest.fn(),
}));
jest.mock("../transaction-update.operation", () => ({
  updateTransactionOperation: jest.fn(),
}));

const createOperation = jest.mocked(createTransactionOperation);
const deleteOperation = jest.mocked(deleteTransactionOperation);
const updateOperation = jest.mocked(updateTransactionOperation);

beforeEach(setupTransactionRepositoryMocks);

describe("FirebaseTransactionRepository.getTransactions", () => {
  it("queries the user's movements and skips malformed documents", async () => {
    mockGetDocs.mockResolvedValue({
      docs: [
        { id: "transaction-1", data: () => transactionDocument() },
        { id: "broken", data: () => ({ amount: 10 }) },
      ],
    });

    const repository = new FirebaseTransactionRepository();
    const transactions = await repository.getTransactions("user-1");

    expect(mockCollection).toHaveBeenCalledWith(
      { name: "test-db" },
      "transactions",
    );
    expect(mockWhere).toHaveBeenCalledWith("ownerId", "==", "user-1");
    expect(mockQuery).toHaveBeenCalledWith(
      { path: "transactions-collection" },
      { field: "ownerId" },
    );
    expect(mockGetDocs).toHaveBeenCalledWith({ path: "transactions-query" });
    expect(transactions.map((transaction) => transaction.id)).toEqual([
      "transaction-1",
    ]);
  });

  it("propagates Firestore failures", async () => {
    const failure = new Error("permission-denied");
    mockGetDocs.mockRejectedValue(failure);

    const repository = new FirebaseTransactionRepository();

    await expect(repository.getTransactions("user-1")).rejects.toBe(failure);
  });
});

describe("FirebaseTransactionRepository mutations", () => {
  it("delegates create, update and delete to their operations", async () => {
    const result = { transaction: {}, wallets: [] };
    createOperation.mockResolvedValue(result as never);
    updateOperation.mockResolvedValue(result as never);
    deleteOperation.mockResolvedValue(result as never);

    const repository = new FirebaseTransactionRepository();
    await repository.createTransaction("user-1", validDto);
    await repository.updateTransaction("user-1", "transaction-1", validDto);
    await repository.deleteTransaction("user-1", "transaction-1");

    expect(createOperation).toHaveBeenCalledWith("user-1", validDto);
    expect(updateOperation).toHaveBeenCalledWith({
      ownerId: "user-1",
      transactionId: "transaction-1",
      dto: validDto,
    });
    expect(deleteOperation).toHaveBeenCalledWith("user-1", "transaction-1");
  });
});
