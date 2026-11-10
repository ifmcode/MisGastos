import { jest } from "@jest/globals";
import { QueryDocumentSnapshot } from "firebase/firestore";

import { Wallet } from "../../types/wallet.types";

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
export const mockDoc = jest.fn((...args: unknown[]) => ({
  kind: args[1],
  id: args[2],
}));

jest.mock("firebase/firestore", () => ({
  deleteField: () => ({ kind: "delete-field" }),
  doc: (...args: unknown[]) => mockDoc(...args),
  runTransaction: (
    database: unknown,
    callback: (transaction: unknown) => Promise<unknown>,
  ) => mockRunTransaction(database, callback),
}));

jest.mock("@/lib/firebase", () => ({ db: { name: "test-db" } }));

export function movement(
  kind: string,
  id: string,
  data: Record<string, unknown>,
): QueryDocumentSnapshot {
  return {
    ref: { kind, id },
    data: () => data,
  } as unknown as QueryDocumentSnapshot;
}

export function buildWallet(id: string, balance: number): Wallet {
  return {
    id,
    name: `Cartera ${id}`,
    currency: "EUR",
    icon: "wallet",
    color: "#0A7EA4",
    initialBalance: balance,
    balance,
    type: "bank",
    includeInTotal: true,
    ownerId: "user-1",
    createdAt: "2026-10-28T10:00:00.000Z",
    updatedAt: "2026-10-28T10:00:00.000Z",
  };
}

export function targetSnapshot(data: Record<string, unknown> = {}) {
  return {
    exists: () => true,
    data: () => ({ ownerId: "user-1", balance: 100, currency: "EUR", ...data }),
  };
}

/** Resets mocks and wires a transaction that resolves against the target doc. */
export function setupReassignMocks(): void {
  jest.clearAllMocks();
  mockRunTransaction.mockImplementation(async (_db, callback) =>
    callback({
      get: mockTransactionGet,
      update: mockTransactionUpdate,
      delete: mockTransactionDelete,
    }),
  );
  mockTransactionGet.mockResolvedValue(targetSnapshot());
}

export const sourceWallet = buildWallet("wallet-1", 50);
export const targetWallet = buildWallet("wallet-2", 100);
