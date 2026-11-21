import { beforeEach, describe, expect, it } from "@jest/globals";

// Imported first so the Firestore mocks are registered before the modules.
import {
  documentSnapshot,
  missingSnapshot,
  mockCollection,
  mockDoc,
  mockGetDoc,
  mockGetDocs,
  mockWhere,
  querySnapshot,
  setupGroupExpensesRepositoryMocks,
} from "./group-expenses-repository.test-helpers";
import {
  GROUP_EXPENSES_COLLECTION,
  getGroupExpenseOperation,
  getGroupExpensesOperation,
} from "../group-expenses.operations";
import { buildDocument, GROUP_ID } from "./group-expense-document.fixtures";

beforeEach(setupGroupExpensesRepositoryMocks);

describe("getGroupExpenseOperation", () => {
  it("reads one expense by id", async () => {
    mockGetDoc.mockResolvedValue(
      documentSnapshot("expense-1", buildDocument()),
    );

    const expense = await getGroupExpenseOperation("expense-1");

    expect(mockDoc).toHaveBeenCalledWith(
      {},
      GROUP_EXPENSES_COLLECTION,
      "expense-1",
    );
    expect(expense).toMatchObject({ id: "expense-1", amountCents: 1000 });
  });

  it("returns null when the document does not exist", async () => {
    mockGetDoc.mockResolvedValue(missingSnapshot());

    await expect(getGroupExpenseOperation("expense-1")).resolves.toBeNull();
  });

  it("returns null when the document cannot be mapped", async () => {
    mockGetDoc.mockResolvedValue(documentSnapshot("expense-1", {}));

    await expect(getGroupExpenseOperation("expense-1")).resolves.toBeNull();
  });
});

describe("getGroupExpensesOperation", () => {
  it("queries by group and drops unmappable documents", async () => {
    mockGetDocs.mockResolvedValue(
      querySnapshot([
        { id: "expense-1", data: () => buildDocument() },
        { id: "broken", data: () => ({}) },
      ]),
    );

    const expenses = await getGroupExpensesOperation(GROUP_ID);

    expect(mockCollection).toHaveBeenCalledWith({}, GROUP_EXPENSES_COLLECTION);
    expect(mockWhere).toHaveBeenCalledWith("groupId", "==", GROUP_ID);
    expect(expenses).toHaveLength(1);
    expect(expenses[0]).toMatchObject({ id: "expense-1" });
  });
});
