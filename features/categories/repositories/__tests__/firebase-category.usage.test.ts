import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import { DEFAULT_CATEGORIES } from "../../utils/default-categories";
import { FirebaseCategoryRepository } from "../firebase-category.repository";

const mockCollection = jest.fn<(...args: unknown[]) => unknown>();
const mockDoc = jest.fn<(...args: unknown[]) => unknown>();
const mockGetDocs = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const mockQuery = jest.fn<(...args: unknown[]) => unknown>();
const mockSetDoc = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const mockWhere = jest.fn<(...args: unknown[]) => unknown>();

jest.mock("firebase/firestore", () => ({
  addDoc: jest.fn(),
  collection: (...args: unknown[]) => mockCollection(...args),
  deleteDoc: jest.fn(),
  doc: (...args: unknown[]) => mockDoc(...args),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  query: (...args: unknown[]) => mockQuery(...args),
  setDoc: (...args: unknown[]) => mockSetDoc(...args),
  updateDoc: jest.fn(),
  where: (...args: unknown[]) => mockWhere(...args),
}));

jest.mock("@/lib/firebase", () => ({ db: { name: "test-db" } }));

beforeEach(() => {
  jest.clearAllMocks();
  mockCollection.mockReturnValue({ path: "collection" });
  mockWhere.mockReturnValue({ field: "ownerId" });
  mockQuery.mockReturnValue({ path: "query" });
  mockDoc.mockImplementation((_db, _name, id) => ({ id }));
});

describe("FirebaseCategoryRepository.seedDefaultCategories", () => {
  it("writes every default with a deterministic document id", async () => {
    mockSetDoc.mockResolvedValue(undefined);

    const categories = await new FirebaseCategoryRepository()
      .seedDefaultCategories("user-1");

    expect(mockSetDoc).toHaveBeenCalledTimes(DEFAULT_CATEGORIES.length);
    expect(mockDoc).toHaveBeenCalledWith(
      { name: "test-db" },
      "categories",
      "user-1__food",
    );
    expect(categories).toHaveLength(DEFAULT_CATEGORIES.length);
    expect(categories[0]).toMatchObject({
      id: "user-1__food",
      legacyId: "food",
      ownerId: "user-1",
    });
  });
});

describe("FirebaseCategoryRepository.countTransactionsUsingCategory", () => {
  beforeEach(() => {
    mockGetDocs.mockResolvedValue({
      docs: [
        { data: () => ({ categoryId: "category-1" }) },
        { data: () => ({ categoryId: "food" }) },
        { data: () => ({ categoryId: "other" }) },
      ],
    });
  });

  it("counts movements by document id and legacy id", async () => {
    const count = await new FirebaseCategoryRepository()
      .countTransactionsUsingCategory("user-1", "category-1", "food");

    expect(mockWhere).toHaveBeenCalledWith("ownerId", "==", "user-1");
    expect(count).toBe(2);
  });

  it("ignores the legacy id when the category has none", async () => {
    const count = await new FirebaseCategoryRepository()
      .countTransactionsUsingCategory("user-1", "category-1");

    expect(count).toBe(1);
  });
});
