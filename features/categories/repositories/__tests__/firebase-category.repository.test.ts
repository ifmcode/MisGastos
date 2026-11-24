import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import { FirebaseCategoryRepository } from "../firebase-category.repository";

const mockAddDoc = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const mockCollection = jest.fn<(...args: unknown[]) => unknown>();
const mockDeleteDoc = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const mockDoc = jest.fn<(...args: unknown[]) => unknown>();
const mockGetDoc = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const mockGetDocs = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const mockQuery = jest.fn<(...args: unknown[]) => unknown>();
const mockSetDoc = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const mockUpdateDoc = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const mockWhere = jest.fn<(...args: unknown[]) => unknown>();
const mockBatchUpdate = jest.fn();
const mockBatchCommit = jest.fn<() => Promise<unknown>>();
const mockWriteBatch = jest.fn<(...args: unknown[]) => unknown>();

jest.mock("firebase/firestore", () => ({
  addDoc: (...args: unknown[]) => mockAddDoc(...args),
  collection: (...args: unknown[]) => mockCollection(...args),
  deleteDoc: (...args: unknown[]) => mockDeleteDoc(...args),
  doc: (...args: unknown[]) => mockDoc(...args),
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  query: (...args: unknown[]) => mockQuery(...args),
  setDoc: (...args: unknown[]) => mockSetDoc(...args),
  updateDoc: (...args: unknown[]) => mockUpdateDoc(...args),
  where: (...args: unknown[]) => mockWhere(...args),
  writeBatch: (...args: unknown[]) => mockWriteBatch(...args),
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
  mockBatchCommit.mockResolvedValue(undefined);
  mockWriteBatch.mockReturnValue({
    update: mockBatchUpdate,
    commit: mockBatchCommit,
  });
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

  it("sorts by explicit order before the legacy creation date", async () => {
    mockGetDocs.mockResolvedValue({
      docs: [
        categoryDoc("older", {
          createdAt: "2026-10-30T09:00:00.000Z",
          sortOrder: 1,
        }),
        categoryDoc("newer", {
          createdAt: "2026-10-30T11:00:00.000Z",
          sortOrder: 0,
        }),
      ],
    });

    const categories = await new FirebaseCategoryRepository().getCategories(
      "user-1",
    );

    expect(categories.map((category) => category.id)).toEqual([
      "newer",
      "older",
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
  it("creates a category with owner, timestamps and the next position", async () => {
    mockAddDoc.mockResolvedValue({ id: "category-2" });
    mockGetDocs.mockResolvedValue({
      docs: [categoryDoc("category-1", { sortOrder: 4 })],
    });

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
        sortOrder: 5,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      }),
    );
    expect(category).toMatchObject({
      id: "category-2",
      ownerId: "user-1",
      sortOrder: 5,
      revision: 0,
    });
  });

  it("writes a category under the provided client id", async () => {
    mockSetDoc.mockResolvedValue(undefined);
    mockGetDocs.mockResolvedValue({ docs: [] });

    const category = await new FirebaseCategoryRepository().createCategory(
      "user-1",
      {
        name: "Restaurantes",
        icon: "fast-food-outline",
        color: "#EF6C00",
        type: "expense",
        id: "  client-category  ",
      },
    );

    expect(mockSetDoc).toHaveBeenCalledWith(
      { id: "client-category" },
      expect.objectContaining({ ownerId: "user-1", revision: 0 }),
    );
    expect(mockAddDoc).not.toHaveBeenCalled();
    expect(category.id).toBe("client-category");
  });

  it("falls back to a generated id for a blank provided id", async () => {
    mockAddDoc.mockResolvedValue({ id: "category-1" });
    mockGetDocs.mockResolvedValue({ docs: [] });

    await new FirebaseCategoryRepository().createCategory("user-1", {
      name: "Restaurantes",
      icon: "fast-food-outline",
      color: "#EF6C00",
      type: "expense",
      id: "   ",
    });

    expect(mockSetDoc).not.toHaveBeenCalled();
    expect(mockAddDoc).toHaveBeenCalled();
  });

  it("starts a new category at position zero when there are none", async () => {
    mockAddDoc.mockResolvedValue({ id: "category-1" });
    mockGetDocs.mockResolvedValue({ docs: [] });

    const category = await new FirebaseCategoryRepository().createCategory(
      "user-1",
      {
        name: "Restaurantes",
        icon: "fast-food-outline",
        color: "#EF6C00",
        type: "expense",
      },
    );

    expect(category.sortOrder).toBe(0);
  });

  it("updates editable fields without writing the type", async () => {
    mockUpdateDoc.mockResolvedValue(undefined);
    mockGetDocs.mockResolvedValue({
      docs: [
        categoryDoc("category-1", {
          name: "Restaurantes",
          revision: 2,
        }),
      ],
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
        revision: 3,
      }),
    );
    expect(mockUpdateDoc.mock.calls[0]?.[1]).not.toHaveProperty("type");
    expect(category.revision).toBe(3);
  });

  it("deletes the category document", async () => {
    mockDeleteDoc.mockResolvedValue(undefined);

    await new FirebaseCategoryRepository().deleteCategory(
      "user-1",
      "category-1",
    );

    expect(mockDeleteDoc).toHaveBeenCalledWith({ id: "category-1" });
  });

  it("persists the reordered positions in one batch and bumps each revision", async () => {
    mockGetDocs.mockResolvedValue({
      docs: [
        categoryDoc("category-1", { revision: 2 }),
        categoryDoc("category-2"),
      ],
    });

    await new FirebaseCategoryRepository().updateCategoryOrders("user-1", [
      { id: "category-1", sortOrder: 0 },
      { id: "category-2", sortOrder: 1 },
    ]);

    expect(mockWriteBatch).toHaveBeenCalledTimes(1);
    expect(mockGetDocs).toHaveBeenCalledTimes(1);
    expect(mockBatchUpdate).toHaveBeenCalledWith(
      { id: "category-1" },
      expect.objectContaining({
        sortOrder: 0,
        updatedAt: expect.any(String),
        revision: 3,
      }),
    );
    expect(mockBatchUpdate).toHaveBeenCalledWith(
      { id: "category-2" },
      expect.objectContaining({
        sortOrder: 1,
        updatedAt: expect.any(String),
        revision: 1,
      }),
    );
    expect(mockBatchCommit).toHaveBeenCalledTimes(1);
  });

  it("skips reorder entries without a stored category", async () => {
    mockGetDocs.mockResolvedValue({
      docs: [categoryDoc("category-1", { revision: 2 })],
    });

    await new FirebaseCategoryRepository().updateCategoryOrders("user-1", [
      { id: "category-1", sortOrder: 0 },
      { id: "category-missing", sortOrder: 1 },
    ]);

    expect(mockBatchUpdate).toHaveBeenCalledTimes(1);
    expect(mockBatchUpdate).toHaveBeenCalledWith(
      { id: "category-1" },
      expect.objectContaining({ revision: 3 }),
    );
    expect(mockBatchCommit).toHaveBeenCalledTimes(1);
  });

  it("skips the batch when no position changed", async () => {
    await new FirebaseCategoryRepository().updateCategoryOrders("user-1", []);

    expect(mockWriteBatch).not.toHaveBeenCalled();
    expect(mockBatchCommit).not.toHaveBeenCalled();
  });
});

describe("FirebaseCategoryRepository.ensureCategory", () => {
  const sharedExpenseCategory = {
    name: "Gastos compartidos",
    icon: "people-outline",
    color: "#0A7EA4",
    type: "expense" as const,
  };

  it("returns the stored document without writing when it exists", async () => {
    mockGetDoc.mockResolvedValue({
      id: "user-1__shared-expense",
      exists: () => true,
      data: () => ({ ...documentData, name: "Viajes" }),
    });

    const category = await new FirebaseCategoryRepository().ensureCategory(
      "user-1",
      "user-1__shared-expense",
      sharedExpenseCategory,
    );

    expect(mockGetDoc).toHaveBeenCalledWith({ id: "user-1__shared-expense" });
    expect(mockSetDoc).not.toHaveBeenCalled();
    expect(category).toMatchObject({ name: "Viajes", ownerId: "user-1" });
  });

  it("creates the deterministic document only when it is missing", async () => {
    mockGetDoc.mockResolvedValue({
      id: "user-1__shared-expense",
      exists: () => false,
      data: () => undefined,
    });
    mockSetDoc.mockResolvedValue(undefined);

    const category = await new FirebaseCategoryRepository().ensureCategory(
      "user-1",
      "user-1__shared-expense",
      sharedExpenseCategory,
    );

    expect(mockDoc).toHaveBeenCalledWith(
      { name: "test-db" },
      "categories",
      "user-1__shared-expense",
    );
    expect(mockSetDoc).toHaveBeenCalledWith(
      { id: "user-1__shared-expense" },
      expect.objectContaining({
        name: "Gastos compartidos",
        icon: "people-outline",
        color: "#0A7EA4",
        type: "expense",
        ownerId: "user-1",
        revision: 0,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      }),
    );
    expect(category).toMatchObject({
      id: "user-1__shared-expense",
      ownerId: "user-1",
      revision: 0,
    });
  });

  it("rewrites a stored document that cannot be mapped", async () => {
    mockGetDoc.mockResolvedValue({
      id: "user-1__shared-expense",
      exists: () => true,
      data: () => ({ name: "" }),
    });
    mockSetDoc.mockResolvedValue(undefined);

    await new FirebaseCategoryRepository().ensureCategory(
      "user-1",
      "user-1__shared-expense",
      sharedExpenseCategory,
    );

    expect(mockSetDoc).toHaveBeenCalledTimes(1);
  });
});
