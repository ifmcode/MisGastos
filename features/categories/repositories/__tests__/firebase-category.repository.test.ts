import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import { FirebaseCategoryRepository } from "../firebase-category.repository";

const mockAddDoc = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const mockCollection = jest.fn<(...args: unknown[]) => unknown>();
const mockDeleteDoc = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const mockDoc = jest.fn<(...args: unknown[]) => unknown>();
const mockGetDocs = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const mockQuery = jest.fn<(...args: unknown[]) => unknown>();
const mockSetDoc = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const mockUpdateDoc = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const mockWhere = jest.fn<(...args: unknown[]) => unknown>();

jest.mock("firebase/firestore", () => ({
  addDoc: (...args: unknown[]) => mockAddDoc(...args),
  collection: (...args: unknown[]) => mockCollection(...args),
  deleteDoc: (...args: unknown[]) => mockDeleteDoc(...args),
  doc: (...args: unknown[]) => mockDoc(...args),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  query: (...args: unknown[]) => mockQuery(...args),
  setDoc: (...args: unknown[]) => mockSetDoc(...args),
  updateDoc: (...args: unknown[]) => mockUpdateDoc(...args),
  where: (...args: unknown[]) => mockWhere(...args),
}));

jest.mock("@/lib/firebase", () => ({ db: { name: "test-db" } }));

const documentData: Record<string, unknown> = {
  name: "Comida",
  icon: "fast-food-outline",
  color: "#EF6C00",
  type: "expense",
  legacyId: "food",
  ownerId: "user-1",
  createdAt: "2026-10-30T10:00:00.000Z",
  updatedAt: "2026-10-30T10:00:00.000Z",
};

function categoryDoc(id: string, overrides: Record<string, unknown> = {}) {
  return { id, data: () => ({ ...documentData, ...overrides }) };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockCollection.mockReturnValue({ path: "categories-collection" });
  mockWhere.mockReturnValue({ field: "ownerId" });
  mockQuery.mockReturnValue({ path: "categories-query" });
  mockDoc.mockImplementation((_db, _name, id) => ({ id }));
});

describe("FirebaseCategoryRepository reads", () => {
  it("queries the owner's categories and sorts by creation date", async () => {
    mockGetDocs.mockResolvedValue({
      docs: [
        categoryDoc("older", { createdAt: "2026-10-30T09:00:00.000Z" }),
        { id: "broken", data: () => ({ name: "" }) },
        categoryDoc("newer", { createdAt: "2026-10-30T11:00:00.000Z" }),
      ],
    });

    const categories = await new FirebaseCategoryRepository().getCategories(
      "user-1",
    );

    expect(mockWhere).toHaveBeenCalledWith("ownerId", "==", "user-1");
    expect(categories.map((category) => category.id)).toEqual([
      "older",
      "newer",
    ]);
  });

  it("resolves a category by document id or legacy id", async () => {
    mockGetDocs.mockResolvedValue({ docs: [categoryDoc("category-1")] });
    const repository = new FirebaseCategoryRepository();

    expect((await repository.getCategory("user-1", "category-1"))?.id).toBe(
      "category-1",
    );
    expect((await repository.getCategory("user-1", "food"))?.id).toBe(
      "category-1",
    );
    expect(await repository.getCategory("user-1", "missing")).toBeNull();
  });
});

describe("FirebaseCategoryRepository writes", () => {
  it("creates a category with owner and timestamps", async () => {
    mockAddDoc.mockResolvedValue({ id: "category-2" });

    const category = await new FirebaseCategoryRepository().createCategory(
      "user-1",
      {
        name: "Restaurantes",
        icon: "fast-food-outline",
        color: "#EF6C00",
        type: "expense",
      },
    );

    expect(mockAddDoc).toHaveBeenCalledWith(
      { path: "categories-collection" },
      expect.objectContaining({
        name: "Restaurantes",
        ownerId: "user-1",
        type: "expense",
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      }),
    );
    expect(category).toMatchObject({ id: "category-2", ownerId: "user-1" });
  });

  it("updates editable fields without writing the type", async () => {
    mockUpdateDoc.mockResolvedValue(undefined);
    mockGetDocs.mockResolvedValue({
      docs: [categoryDoc("category-1", { name: "Restaurantes" })],
    });

    const category = await new FirebaseCategoryRepository().updateCategory(
      "user-1",
      "category-1",
      { name: "Restaurantes", icon: "cafe-outline", color: "#00838F" },
    );

    expect(mockUpdateDoc).toHaveBeenCalledWith(
      { id: "category-1" },
      expect.objectContaining({
        name: "Restaurantes",
        icon: "cafe-outline",
        color: "#00838F",
        updatedAt: expect.any(String),
      }),
    );
    expect(mockUpdateDoc.mock.calls[0]?.[1]).not.toHaveProperty("type");
    expect(category).toMatchObject({
      id: "category-1",
      color: "#00838F",
      type: "expense",
    });
  });

  it("deletes the category document", async () => {
    mockDeleteDoc.mockResolvedValue(undefined);

    await new FirebaseCategoryRepository().deleteCategory(
      "user-1",
      "category-1",
    );

    expect(mockDeleteDoc).toHaveBeenCalledWith({ id: "category-1" });
  });
});
