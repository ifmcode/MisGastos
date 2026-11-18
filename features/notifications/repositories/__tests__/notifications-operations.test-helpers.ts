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
export const mockOnSnapshot = jest.fn<(...args: unknown[]) => unknown>();

jest.mock("firebase/firestore", () => ({
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  setDoc: (...args: unknown[]) => mockSetDoc(...args),
  updateDoc: (...args: unknown[]) => mockUpdateDoc(...args),
  doc: (...args: unknown[]) => mockDoc(...args),
  collection: (...args: unknown[]) => mockCollection(...args),
  query: (...args: unknown[]) => mockQuery(...args),
  where: (...args: unknown[]) => mockWhere(...args),
  onSnapshot: (...args: unknown[]) => mockOnSnapshot(...args),
}));

jest.mock("@/lib/firebase", () => ({ db: {} }));

/** Clears the Firestore mocks and restores the reference shapes. */
export function setupNotificationMocks() {
  jest.resetAllMocks();
  mockCollection.mockReturnValue({ path: "notifications" });
  mockQuery.mockReturnValue({ path: "query" });
  mockWhere.mockReturnValue({ path: "where" });
  mockDoc.mockImplementation((...args: unknown[]) => {
    if (args.length === 1) {
      return { id: "generated", path: "notifications/generated" };
    }

    return {
      id: String(args[2]),
      path: `${String(args[1])}/${String(args[2])}`,
    };
  });
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
