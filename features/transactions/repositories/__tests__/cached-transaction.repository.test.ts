import { beforeEach, describe, expect, it, jest } from "@jest/globals";

jest.mock("../local-transaction.cache", () => ({
  cacheTransactions: jest.fn(),
  cacheTransaction: jest.fn(),
  readCachedTransactions: jest.fn(async () => null),
}));

import {
  cacheTransaction,
  cacheTransactions,
  readCachedTransactions,
} from "../local-transaction.cache";
import { CachedTransactionRepository } from "../cached-transaction.repository";
import {
  ITransactionRepository,
  TransactionMutationResult,
} from "../transaction.repository";
import {
  CreateTransactionDto,
  UpdateTransactionDto,
} from "../../types/transaction.types";
import { buildTransaction } from "./local-transaction.fixtures";

const listMock = jest.mocked(cacheTransactions);
const singleMock = jest.mocked(cacheTransaction);
const readMock = jest.mocked(readCachedTransactions);

function createRemote(): jest.Mocked<ITransactionRepository> {
  return {
    getTransactions: jest.fn(),
    createTransaction: jest.fn(),
    updateTransaction: jest.fn(),
    deleteTransaction: jest.fn(),
  };
}

const dto: CreateTransactionDto = {
  type: "expense",
  amount: 10,
  currency: "EUR",
  walletId: "wallet-1",
  categoryId: "category-1",
  concept: "Cena",
  date: "2026-10-29",
};

function buildResult(): TransactionMutationResult {
  return { transaction: buildTransaction(), wallets: [] };
}

describe("CachedTransactionRepository", () => {
  let remote: jest.Mocked<ITransactionRepository>;
  let repository: CachedTransactionRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    remote = createRemote();
    repository = new CachedTransactionRepository(remote);
  });

  it("mirrors the list read and returns the remote list", async () => {
    const transactions = [buildTransaction()];
    remote.getTransactions.mockResolvedValue(transactions);

    await expect(repository.getTransactions("owner-1")).resolves.toBe(
      transactions,
    );

    expect(remote.getTransactions).toHaveBeenCalledWith("owner-1");
    expect(listMock).toHaveBeenCalledWith(
      "owner-1",
      transactions,
      expect.any(String),
    );
  });

  it("returns the merged cache so a pending local row survives a stale remote read", async () => {
    const remoteList = [buildTransaction({ id: "server-1" })];
    const merged = [
      buildTransaction({ id: "server-1" }),
      buildTransaction({ id: "local-pending" }),
    ];
    remote.getTransactions.mockResolvedValue(remoteList);
    readMock.mockResolvedValueOnce(merged);

    await expect(repository.getTransactions("owner-1")).resolves.toBe(merged);
  });

  it("does not reject when the list cache write fails", async () => {
    const transactions = [buildTransaction()];
    remote.getTransactions.mockResolvedValue(transactions);
    listMock.mockRejectedValueOnce(new Error("disk full"));

    await expect(repository.getTransactions("owner-1")).resolves.toBe(
      transactions,
    );
  });

  it("mirrors the created record and returns the remote result", async () => {
    const result = buildResult();
    remote.createTransaction.mockResolvedValue(result);

    await expect(repository.createTransaction("owner-1", dto)).resolves.toBe(
      result,
    );
    expect(remote.createTransaction).toHaveBeenCalledWith("owner-1", dto);
    expect(singleMock).toHaveBeenCalledWith(
      "owner-1",
      result.transaction,
      expect.any(String),
    );
  });

  it("mirrors the updated record", async () => {
    const result = buildResult();
    const update: UpdateTransactionDto = dto;
    remote.updateTransaction.mockResolvedValue(result);

    await expect(
      repository.updateTransaction("owner-1", "transaction-1", update),
    ).resolves.toBe(result);
    expect(singleMock).toHaveBeenCalledWith(
      "owner-1",
      result.transaction,
      expect.any(String),
    );
  });

  it("mirrors the soft-deleted record returned by delete", async () => {
    const result: TransactionMutationResult = {
      transaction: buildTransaction({
        deletedAt: "2026-11-01T10:00:00.000Z",
      }),
      wallets: [],
    };
    remote.deleteTransaction.mockResolvedValue(result);

    await expect(
      repository.deleteTransaction("owner-1", "transaction-1"),
    ).resolves.toBe(result);
    expect(singleMock).toHaveBeenCalledWith(
      "owner-1",
      result.transaction,
      expect.any(String),
    );
  });

  it("does not reject when the single-record cache fails", async () => {
    const result = buildResult();
    remote.createTransaction.mockResolvedValue(result);
    singleMock.mockRejectedValueOnce(new Error("disk full"));

    await expect(repository.createTransaction("owner-1", dto)).resolves.toBe(
      result,
    );
  });
});
