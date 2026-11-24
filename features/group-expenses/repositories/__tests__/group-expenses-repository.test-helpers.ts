import { jest } from "@jest/globals";

export const mockGetDoc = jest.fn<(...args: unknown[]) => Promise<unknown>>();
export const mockGetDocs = jest.fn<(...args: unknown[]) => Promise<unknown>>();
export const mockSetDoc = jest.fn<(...args: unknown[]) => Promise<unknown>>();
export const mockUpdateDoc = jest.fn<
  (...args: unknown[]) => Promise<unknown>
>();
export const mockDoc = jest.fn<(...args: unknown[]) => unknown>();
export const mockCollection = jest.fn<(...args: unknown[]) => unknown>();
export const mockQuery = jest.fn<(...args: unknown[]) => unknown>();
export const mockWhere = jest.fn<(...args: unknown[]) => unknown>();
export const mockBatchSet = jest.fn((..._args: unknown[]) => undefined);
export const mockBatchUpdate = jest.fn((..._args: unknown[]) => undefined);
export const mockBatchCommit = jest.fn<() => Promise<unknown>>();
export const mockWriteBatch = jest.fn<(...args: unknown[]) => unknown>();
export const mockRunTransaction = jest.fn<
  (
    db: unknown,
    callback: (transaction: unknown) => Promise<unknown>,
  ) => Promise<unknown>
>();
export const mockTransactionGet = jest.fn<
  (...args: unknown[]) => Promise<unknown>
>();
export const mockTransactionSet = jest.fn((..._args: unknown[]) => undefined);
export const mockTransactionUpdate = jest.fn(
  (..._args: unknown[]) => undefined,
);

export const GENERATED_EXPENSE_ID = "group-expense-generated";

jest.mock("firebase/firestore", () => ({
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  setDoc: (...args: unknown[]) => mockSetDoc(...args),
  updateDoc: (...args: unknown[]) => mockUpdateDoc(...args),
  doc: (...args: unknown[]) => mockDoc(...args),
  collection: (...args: unknown[]) => mockCollection(...args),
  query: (...args: unknown[]) => mockQuery(...args),
  where: (...args: unknown[]) => mockWhere(...args),
  writeBatch: (...args: unknown[]) => mockWriteBatch(...args),
  runTransaction: (...args: unknown[]) =>
    mockRunTransaction(
      args[0],
      args[1] as (transaction: unknown) => Promise<unknown>,
    ),
}));

jest.mock("@/lib/firebase", () => ({
  db: {},
}));

/** Clears the Firestore mocks and restores the reference shapes. */
export function setupGroupExpensesRepositoryMocks() {
  jest.clearAllMocks();
  mockCollection.mockImplementation((...args: unknown[]) =>
    args.length === 4 ? { path: "activity" } : { path: "collection" },
  );
  mockQuery.mockReturnValue({ path: "query" });
  mockWhere.mockReturnValue({ path: "where" });
  mockDoc.mockImplementation((...args: unknown[]) => {
    if (args.length === 1) {
      if ((args[0] as { path?: string } | undefined)?.path === "activity") {
        return { kind: "activity", id: "activity-1" };
      }

      return {
        id: GENERATED_EXPENSE_ID,
        path: `groupExpenses/${GENERATED_EXPENSE_ID}`,
      };
    }

    return {
      id: String(args[2]),
      path: `${String(args[1])}/${String(args[2])}`,
    };
  });
  mockWriteBatch.mockReturnValue({
    set: mockBatchSet,
    update: mockBatchUpdate,
    commit: mockBatchCommit,
  });
  mockBatchCommit.mockResolvedValue(undefined);
  mockRunTransaction.mockImplementation(async (_db, callback) =>
    callback({
      get: mockTransactionGet,
      set: mockTransactionSet,
      update: mockTransactionUpdate,
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
