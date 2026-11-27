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
export const mockRunTransaction = jest.fn<
  (
    db: unknown,
    callback: (transaction: unknown) => Promise<unknown>,
  ) => Promise<unknown>
>();

export const GENERATED_EXPENSE_ID = "expense-generated";

jest.mock("firebase/firestore", () => ({
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  setDoc: (...args: unknown[]) => mockSetDoc(...args),
  updateDoc: (...args: unknown[]) => mockUpdateDoc(...args),
  doc: (...args: unknown[]) => mockDoc(...args),
  collection: (...args: unknown[]) => mockCollection(...args),
  query: (...args: unknown[]) => mockQuery(...args),
  where: (...args: unknown[]) => mockWhere(...args),
  runTransaction: (
    database: unknown,
    callback: (transaction: unknown) => Promise<unknown>,
  ) => mockRunTransaction(database, callback),
}));

jest.mock("@/lib/firebase", () => ({
  db: {},
}));

/** Clears the Firestore mocks and restores the reference shapes. */
export function setupSharedExpensesRepositoryMocks() {
  jest.clearAllMocks();
  mockCollection.mockReturnValue({ path: "collection" });
  mockQuery.mockReturnValue({ path: "query" });
  mockWhere.mockReturnValue({ path: "where" });
  mockDoc.mockImplementation((...args: unknown[]) => {
    if (args.length === 1) {
      return {
        id: GENERATED_EXPENSE_ID,
        path: `sharedExpenses/${GENERATED_EXPENSE_ID}`,
      };
    }

    return {
      id: String(args[2]),
      path: `${String(args[1])}/${String(args[2])}`,
    };
  });
  mockRunTransaction.mockImplementation(async (_db, callback) =>
    callback({
      get: (...args: unknown[]) => mockGetDoc(...args),
      set: (...args: unknown[]) => mockSetDoc(...args),
      update: (...args: unknown[]) => mockUpdateDoc(...args),
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
