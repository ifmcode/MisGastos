import { jest } from "@jest/globals";
import { QueryDocumentSnapshot } from "firebase/firestore";

export const mockAddDoc = jest.fn<(...args: unknown[]) => Promise<unknown>>();
export const mockCollection = jest.fn<(...args: unknown[]) => unknown>();
export const mockDeleteDoc = jest.fn<(...args: unknown[]) => Promise<void>>();
export const mockDoc = jest.fn((...args: unknown[]) => ({
  kind: args[1],
  id: args[2],
}));
export const mockGetDoc = jest.fn<(...args: unknown[]) => Promise<unknown>>();
export const mockGetDocs = jest.fn<(...args: unknown[]) => Promise<unknown>>();
export const mockQuery = jest.fn<(...args: unknown[]) => unknown>();
export const mockUpdateDoc = jest.fn<(...args: unknown[]) => Promise<void>>();
export const mockWhere = jest.fn<(...args: unknown[]) => unknown>();
export const mockBatchUpdate = jest.fn<(...args: unknown[]) => void>();
export const mockBatchDelete = jest.fn<(...args: unknown[]) => void>();
export const mockBatchCommit = jest.fn<() => Promise<void>>();
export const mockWriteBatch = jest.fn(() => ({
  update: mockBatchUpdate,
  delete: mockBatchDelete,
  commit: mockBatchCommit,
}));
export const mockTransactionGet = jest.fn<
  (...args: unknown[]) => Promise<unknown>
>();
export const mockTransactionUpdate = jest.fn<(...args: unknown[]) => void>();
export const mockTransactionDelete = jest.fn<(...args: unknown[]) => void>();
export const mockRunTransaction = jest.fn<
  (
    db: unknown,
    callback: (transaction: unknown) => Promise<unknown>,
  ) => Promise<unknown>
>();

jest.mock("firebase/firestore", () => ({
  addDoc: (...args: unknown[]) => mockAddDoc(...args),
  collection: (...args: unknown[]) => mockCollection(...args),
  deleteDoc: (...args: unknown[]) => mockDeleteDoc(...args),
  deleteField: () => ({ kind: "delete-field" }),
  doc: (...args: unknown[]) => mockDoc(...args),
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  query: (...args: unknown[]) => mockQuery(...args),
  runTransaction: (
    database: unknown,
    callback: (transaction: unknown) => Promise<unknown>,
  ) => mockRunTransaction(database, callback),
  updateDoc: (...args: unknown[]) => mockUpdateDoc(...args),
  where: (...args: unknown[]) => mockWhere(...args),
  writeBatch: () => mockWriteBatch(),
}));

jest.mock("@/lib/firebase", () => ({ db: { name: "test-db" } }));

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

export function snapshot(id: string, data?: Record<string, unknown>) {
  return { id, exists: () => data !== undefined, data: () => data };
}

export function movement(
  kind: string,
  id: string,
  data: Record<string, unknown>,
): QueryDocumentSnapshot {
  return {
    id,
    ref: { kind, id },
    data: () => data,
  } as unknown as QueryDocumentSnapshot;
}

export function setupWalletRepositoryMocks(): void {
  jest.resetAllMocks();

  mockCollection.mockReturnValue({ path: "collection" });
  mockWhere.mockReturnValue({ field: "ownerId" });
  mockQuery.mockReturnValue({ path: "query" });
  mockDoc.mockImplementation((...args: unknown[]) => ({
    kind: args[1],
    id: args[2],
  }));
  mockWriteBatch.mockImplementation(() => ({
    update: mockBatchUpdate,
    delete: mockBatchDelete,
    commit: mockBatchCommit,
  }));
  mockBatchCommit.mockResolvedValue();
  mockRunTransaction.mockImplementation(async (_db, callback) =>
    callback({
      get: mockTransactionGet,
      update: mockTransactionUpdate,
      delete: mockTransactionDelete,
    }),
  );
}
