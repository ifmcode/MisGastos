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

type RunTransactionCallback = (transaction: unknown) => Promise<unknown>;
type RunTransactionMock = (
  db: unknown,
  run: RunTransactionCallback,
) => Promise<unknown>;

export const mockRunTransaction = jest.fn<RunTransactionMock>();
export const mockTransactionGet = jest.fn<
  (...args: unknown[]) => Promise<unknown>
>();
export const mockTransactionUpdate = jest.fn(
  (..._args: unknown[]) => undefined,
);

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
export function setupGroupsRepositoryMocks() {
  jest.clearAllMocks();
  // `clearAllMocks` keeps queued `*Once` values, so reset the ones that tests
  // queue per call to keep a reordered run deterministic.
  mockTransactionGet.mockReset();
  mockGetDoc.mockReset();
  mockGetDocs.mockReset();
  let generatedDocs = 0;
  mockCollection.mockReturnValue({ path: "collection" });
  mockQuery.mockReturnValue({ path: "query" });
  mockWhere.mockReturnValue({ path: "where" });
  mockDoc.mockImplementation((first, second, third) => {
    if (typeof second === "string" && typeof third === "string") {
      return { id: third, path: `${second}/${third}` };
    }

    generatedDocs += 1;
    const id = `generated-${generatedDocs}`;
    return { id, path: `collection/${id}` };
  });
  mockWriteBatch.mockReturnValue({
    set: mockBatchSet,
    update: mockBatchUpdate,
    commit: mockBatchCommit,
  });
  mockBatchCommit.mockResolvedValue(undefined);
  mockSetDoc.mockResolvedValue(undefined);
  mockUpdateDoc.mockResolvedValue(undefined);
  mockRunTransaction.mockImplementation(async (_db, run) =>
    run({
      get: mockTransactionGet,
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

export const GROUP_ID = "user-a__group-1";
export const INVITATION_ID = `${GROUP_ID}__user-b`;

export const GROUP_DOCUMENT = {
  ownerId: "user-a",
  memberIds: ["user-a", "user-b"],
  name: "Viaje",
  description: null,
  defaultCurrency: "EUR",
  joinCode: "ABCD2345",
  createdAt: "2026-11-20T10:00:00.000Z",
  updatedAt: "2026-11-20T10:00:00.000Z",
};

export const INVITATION_DOCUMENT = {
  groupId: GROUP_ID,
  groupName: "Viaje",
  inviterId: "user-a",
  inviteeId: "user-b",
  pairId: "user-a__user-b",
  status: "pending",
  createdAt: "2026-11-20T10:00:00.000Z",
  updatedAt: "2026-11-20T10:00:00.000Z",
};
