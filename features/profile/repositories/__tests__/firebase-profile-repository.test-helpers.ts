import { jest } from "@jest/globals";

export const mockGetDocs = jest.fn<
  (...args: unknown[]) => Promise<unknown>
>();
export const mockAddDoc = jest.fn<(...args: unknown[]) => Promise<unknown>>();
export const mockUpdateDoc = jest.fn<
  (...args: unknown[]) => Promise<unknown>
>();
export const mockDoc = jest.fn<(...args: unknown[]) => unknown>();
export const mockCollection = jest.fn<(...args: unknown[]) => unknown>();
export const mockQuery = jest.fn<(...args: unknown[]) => unknown>();
export const mockWhere = jest.fn<(...args: unknown[]) => unknown>();

jest.mock("firebase/firestore", () => ({
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  addDoc: (...args: unknown[]) => mockAddDoc(...args),
  updateDoc: (...args: unknown[]) => mockUpdateDoc(...args),
  doc: (...args: unknown[]) => mockDoc(...args),
  collection: (...args: unknown[]) => mockCollection(...args),
  query: (...args: unknown[]) => mockQuery(...args),
  where: (...args: unknown[]) => mockWhere(...args),
}));

jest.mock("@/lib/firebase", () => ({
  db: {},
}));

/** Clears the Firestore mocks and restores the reference shapes. */
export function setupProfileRepositoryMocks() {
  jest.clearAllMocks();
  mockCollection.mockReturnValue({ path: "collection" });
  mockQuery.mockReturnValue({ path: "query" });
  mockWhere.mockReturnValue({ path: "where" });
  mockDoc.mockImplementation((_db, _name, id) => ({
    path: `users/${String(id)}`,
  }));
}
