import { jest } from "@jest/globals";

export const mockGetDoc = jest.fn<(...args: unknown[]) => Promise<unknown>>();
export const mockGetDocs = jest.fn<(...args: unknown[]) => Promise<unknown>>();
export const mockSetDoc = jest.fn<(...args: unknown[]) => Promise<unknown>>();
export const mockUpdateDoc = jest.fn<
  (...args: unknown[]) => Promise<unknown>
>();
export const mockDeleteDoc = jest.fn<
  (...args: unknown[]) => Promise<unknown>
>();
type RunTransactionCallback = (transaction: unknown) => Promise<unknown>;
type RunTransactionMock = (
  db: unknown,
  run: RunTransactionCallback,
) => Promise<unknown>;

export const mockRunTransaction = jest.fn<RunTransactionMock>();
export const mockTransactionGet = jest.fn<
  (...args: unknown[]) => Promise<unknown>
>();
export const mockTransactionSet = jest.fn((..._args: unknown[]) => undefined);
export const mockTransactionDelete = jest.fn(
  (..._args: unknown[]) => undefined,
);
export const mockDoc = jest.fn<(...args: unknown[]) => unknown>();
export const mockCollection = jest.fn<(...args: unknown[]) => unknown>();
export const mockQuery = jest.fn<(...args: unknown[]) => unknown>();
export const mockWhere = jest.fn<(...args: unknown[]) => unknown>();
export const mockLimit = jest.fn<(...args: unknown[]) => unknown>();

jest.mock("firebase/firestore", () => ({
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  setDoc: (...args: unknown[]) => mockSetDoc(...args),
  updateDoc: (...args: unknown[]) => mockUpdateDoc(...args),
  deleteDoc: (...args: unknown[]) => mockDeleteDoc(...args),
  runTransaction: (...args: unknown[]) =>
    mockRunTransaction(
      args[0],
      args[1] as (transaction: unknown) => Promise<unknown>,
    ),
  doc: (...args: unknown[]) => mockDoc(...args),
  collection: (...args: unknown[]) => mockCollection(...args),
  query: (...args: unknown[]) => mockQuery(...args),
  where: (...args: unknown[]) => mockWhere(...args),
  limit: (...args: unknown[]) => mockLimit(...args),
}));

jest.mock("@/lib/firebase", () => ({
  db: {},
}));

/** Clears the Firestore mocks and restores the reference shapes. */
export function setupFriendsRepositoryMocks() {
  jest.clearAllMocks();
  mockCollection.mockReturnValue({ path: "collection" });
  mockQuery.mockReturnValue({ path: "query" });
  mockWhere.mockReturnValue({ path: "where" });
  mockLimit.mockReturnValue({ path: "limit" });
  mockDoc.mockImplementation((_db, name, id) => ({
    path: `${String(name)}/${String(id)}`,
  }));
  mockRunTransaction.mockImplementation(async (_db, run) =>
    run({
      get: mockTransactionGet,
      set: mockTransactionSet,
      delete: mockTransactionDelete,
    }),
  );
}

export function documentSnapshot(
  id: string,
  data: unknown,
): { id: string; exists: () => boolean; data: () => unknown } {
  return { id, exists: () => true, data: () => data };
}

export function missingSnapshot(): {
  id: string;
  exists: () => boolean;
  data: () => undefined;
} {
  return { id: "", exists: () => false, data: () => undefined };
}

export function querySnapshot(
  documents: Array<{ id: string; data: () => unknown }>,
): { docs: Array<{ id: string; data: () => unknown }> } {
  return { docs: documents };
}
