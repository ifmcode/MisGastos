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
  setupSharedExpensesRepositoryMocks,
} from "./shared-expenses-repository.test-helpers";
import {
  SHARED_EXPENSES_COLLECTION,
  getSharedExpenseOperation,
  getSharedExpensesOperation,
} from "../shared-expenses.operations";
import { buildExpenseDocument } from "./shared-expense-document.fixtures";

beforeEach(setupSharedExpensesRepositoryMocks);

describe("getSharedExpenseOperation", () => {
  it("reads one expense by id", async () => {
    mockGetDoc.mockResolvedValue(
      documentSnapshot("expense-1", buildExpenseDocument()),
    );

    const expense = await getSharedExpenseOperation("expense-1");

    expect(mockDoc).toHaveBeenCalledWith(
      {},
      SHARED_EXPENSES_COLLECTION,
      "expense-1",
    );
    expect(expense).toMatchObject({ id: "expense-1", amountCents: 1000 });
  });

  it("returns null when the document does not exist", async () => {
    mockGetDoc.mockResolvedValue(missingSnapshot());

    await expect(getSharedExpenseOperation("expense-1")).resolves.toBeNull();
  });
});

describe("getSharedExpensesOperation", () => {
  it("queries by participant and drops unmappable documents", async () => {
    mockGetDocs.mockResolvedValue(
      querySnapshot([
        { id: "expense-1", data: () => buildExpenseDocument() },
        { id: "broken", data: () => ({}) },
      ]),
    );

    const expenses = await getSharedExpensesOperation("user-a");

    expect(mockCollection).toHaveBeenCalledWith({}, SHARED_EXPENSES_COLLECTION);
    expect(mockWhere).toHaveBeenCalledWith(
      "participantIds",
      "array-contains",
      "user-a",
    );
    expect(expenses).toHaveLength(1);
    expect(expenses[0]).toMatchObject({ id: "expense-1" });
  });
});
