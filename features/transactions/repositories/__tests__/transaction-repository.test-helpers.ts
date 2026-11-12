import { jest } from "@jest/globals";

import { CreateTransactionDto } from "../../types/transaction.types";

export const mockCollection = jest.fn<(...args: unknown[]) => unknown>();
export const mockDoc = jest.fn<(...args: unknown[]) => unknown>();
export const mockGetDoc = jest.fn<(...args: unknown[]) => Promise<unknown>>();
export const mockGetDocs = jest.fn<(...args: unknown[]) => Promise<unknown>>();
export const mockQuery = jest.fn<(...args: unknown[]) => unknown>();
export const mockRunTransaction = jest.fn<
  (
    db: unknown,
    callback: (transaction: unknown) => Promise<unknown>,
  ) => Promise<unknown>
>();
export const mockWhere = jest.fn<(...args: unknown[]) => unknown>();

jest.mock("firebase/firestore", () => ({
  collection: (...args: unknown[]) => mockCollection(...args),
  deleteField: () => ({ kind: "delete-field" }),
  doc: (...args: unknown[]) => mockDoc(...args),
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  query: (...args: unknown[]) => mockQuery(...args),
  runTransaction: (
    database: unknown,
    callback: (transaction: unknown) => Promise<unknown>,
  ) => mockRunTransaction(database, callback),
  where: (...args: unknown[]) => mockWhere(...args),
}));

jest.mock("@/lib/firebase", () => ({ db: { name: "test-db" } }));

export const transactionGet = jest.fn<
  (...args: unknown[]) => Promise<unknown>
>();
export const transactionSet = jest.fn<(...args: unknown[]) => void>();
export const transactionUpdate = jest.fn<(...args: unknown[]) => void>();
export const transactionDelete = jest.fn<(...args: unknown[]) => void>();
export const mockTransaction = {
  delete: transactionDelete,
  get: transactionGet,
  set: transactionSet,
  update: transactionUpdate,
};

export const walletRef = { kind: "wallet", id: "wallet-1" };
export const transactionRef = { kind: "transaction", id: "transaction-1" };

export const validDto: CreateTransactionDto = {
  type: "expense",
  amount: 25.5,
  currency: "EUR",
  walletId: "wallet-1",
  categoryId: "category-1",
  concept: "  Supermercado  ",
  notes: "  Compra semanal  ",
  date: "2026-11-12",
};

export function walletDocument(overrides: Record<string, unknown> = {}) {
  return {
    name: "Cuenta principal",
    currency: "EUR",
    icon: "wallet",
    color: "#0A7EA4",
    initialBalance: 100,
    balance: 100,
    type: "bank",
    includeInTotal: true,
    ownerId: "user-1",
    createdAt: "2026-10-28T10:00:00.000Z",
    updatedAt: "2026-10-28T10:00:00.000Z",
    ...overrides,
  };
}

export function transactionDocument(overrides: Record<string, unknown> = {}) {
  return {
    type: "expense",
    amount: 25.5,
    currency: "EUR",
    walletId: "wallet-1",
    categoryId: "category-1",
    concept: "Supermercado",
    notes: "Compra semanal",
    date: "2026-11-12",
    ownerId: "user-1",
    createdAt: "2026-11-12T10:00:00.000Z",
    updatedAt: "2026-11-12T10:00:00.000Z",
    ...overrides,
  };
}

export function snapshot(id: string, data?: Record<string, unknown>) {
  return {
    id,
    exists: () => data !== undefined,
    data: () => data,
  };
}

/** Resets the Firestore mocks and re-installs the default spies. */
export function setupTransactionRepositoryMocks() {
  jest.resetAllMocks();

  mockCollection.mockReturnValue({ path: "transactions-collection" });
  mockWhere.mockReturnValue({ field: "ownerId" });
  mockQuery.mockReturnValue({ path: "transactions-query" });

  mockDoc.mockImplementation((...args: unknown[]) => {
    if (args.length === 1) return transactionRef;
    if (args[1] === "wallets") {
      return { kind: "wallet", id: args[2] };
    }
    return { kind: "transaction", id: args[2] };
  });

  mockRunTransaction.mockImplementation(async (_db, callback) =>
    callback(mockTransaction),
  );
}
