import { jest } from "@jest/globals";

import { CreateTransferDto } from "../../types/transfer.types";

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
export const mockTransaction = {
  get: transactionGet,
  set: transactionSet,
  update: transactionUpdate,
};

export const fromWalletRef = { kind: "wallet", id: "wallet-1" };
export const toWalletRef = { kind: "wallet", id: "wallet-2" };
export const transferRef = { kind: "transfer", id: "transfer-1" };

export const validDto: CreateTransferDto = {
  fromWalletId: "wallet-1",
  toWalletId: "wallet-2",
  amount: 25.5,
  currency: "EUR",
  date: "2026-10-29",
  notes: "  Ahorro mensual  ",
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

export function transferDocument(overrides: Record<string, unknown> = {}) {
  return {
    fromWalletId: "wallet-1",
    toWalletId: "wallet-2",
    amount: 25.5,
    currency: "EUR",
    date: "2026-10-29",
    notes: "Ahorro mensual",
    ownerId: "user-1",
    createdAt: "2026-10-29T10:00:00.000Z",
    updatedAt: "2026-10-29T10:00:00.000Z",
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

export function mockWalletSnapshots(
  fromOverrides: Record<string, unknown> = {},
  toOverrides: Record<string, unknown> = {},
) {
  transactionGet
    .mockResolvedValueOnce(
      snapshot("wallet-1", walletDocument(fromOverrides)),
    )
    .mockResolvedValueOnce(snapshot("wallet-2", walletDocument(toOverrides)));
}

/** Resets the Firestore mocks and re-installs the default spies. */
export function setupTransferRepositoryMocks() {
  jest.resetAllMocks();

  mockCollection.mockReturnValue({ path: "transfers-collection" });
  mockWhere.mockReturnValue({ field: "ownerId" });
  mockQuery.mockReturnValue({ path: "transfers-query" });

  mockDoc.mockImplementation((...args: unknown[]) => {
    if (args.length === 1) return transferRef;
    if (args[1] === "transfers") {
      return { kind: "transfer", id: args[2] };
    }
    return { kind: "wallet", id: args[2] };
  });

  mockRunTransaction.mockImplementation(async (_db, callback) =>
    callback(mockTransaction),
  );
}
