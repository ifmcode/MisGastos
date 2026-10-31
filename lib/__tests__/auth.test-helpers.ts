import { jest } from "@jest/globals";

export const mockSignInWithPopup = jest.fn<
  (...args: unknown[]) => Promise<unknown>
>();
export const mockSignInWithEmailAndPassword = jest.fn<
  (...args: unknown[]) => Promise<unknown>
>();
export const mockCreateUserWithEmailAndPassword = jest.fn<
  (...args: unknown[]) => Promise<unknown>
>();
export const mockSendPasswordResetEmail = jest.fn<
  (...args: unknown[]) => Promise<unknown>
>();
export const mockSignOut = jest.fn<(...args: unknown[]) => unknown>();
export const mockGetDocs = jest.fn<
  (...args: unknown[]) => Promise<unknown>
>();
export const mockAddDoc = jest.fn<(...args: unknown[]) => Promise<unknown>>();
export const mockQuery = jest.fn<(...args: unknown[]) => unknown>();
export const mockCollection = jest.fn<(...args: unknown[]) => unknown>();
export const mockWhere = jest.fn<(...args: unknown[]) => unknown>();

jest.mock("firebase/auth", () => ({
  GoogleAuthProvider: jest.fn(),
  signInWithPopup: (...args: unknown[]) => mockSignInWithPopup(...args),
  signInWithEmailAndPassword: (...args: unknown[]) =>
    mockSignInWithEmailAndPassword(...args),
  createUserWithEmailAndPassword: (...args: unknown[]) =>
    mockCreateUserWithEmailAndPassword(...args),
  sendPasswordResetEmail: (...args: unknown[]) =>
    mockSendPasswordResetEmail(...args),
  signOut: (...args: unknown[]) => mockSignOut(...args),
}));

jest.mock("firebase/firestore", () => ({
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  addDoc: (...args: unknown[]) => mockAddDoc(...args),
  query: (...args: unknown[]) => mockQuery(...args),
  collection: (...args: unknown[]) => mockCollection(...args),
  where: (...args: unknown[]) => mockWhere(...args),
}));

jest.mock("../firebase", () => ({
  auth: { currentUser: null },
  db: {},
}));

/** Clears spies and stubs the browser globals used by the auth helpers. */
export function setupAuthMocks() {
  jest.clearAllMocks();
  jest.spyOn(console, "error").mockImplementation(() => {});
  global.alert = jest.fn();
}
