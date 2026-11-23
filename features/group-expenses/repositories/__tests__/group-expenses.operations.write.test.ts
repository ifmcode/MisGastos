import { beforeEach, describe, expect, it } from "@jest/globals";

// Imported first so the Firestore mocks are registered before the modules.
import {
  GENERATED_EXPENSE_ID,
  documentSnapshot,
  missingSnapshot,
  mockDoc,
  mockGetDoc,
  mockSetDoc,
  mockUpdateDoc,
  setupGroupExpensesRepositoryMocks,
} from "./group-expenses-repository.test-helpers";
import {
  createGroupExpenseOperation,
  softDeleteGroupExpenseOperation,
  updateGroupExpenseOperation,
} from "../group-expenses.operations";
import {
  buildCreateDto,
  buildDocument,
  buildUpdateDto,
} from "./group-expense-document.fixtures";

beforeEach(setupGroupExpensesRepositoryMocks);

const createDto = buildCreateDto();
const updateDto = buildUpdateDto();

const createdRef = {
  id: GENERATED_EXPENSE_ID,
  path: `groupExpenses/${GENERATED_EXPENSE_ID}`,
};

describe("createGroupExpenseOperation", () => {
  it("generates the id and stores the full document", async () => {
    mockSetDoc.mockResolvedValue(undefined);

    const expense = await createGroupExpenseOperation(createDto);

    expect(mockDoc).toHaveBeenCalledWith({ path: "collection" });
    expect(mockSetDoc).toHaveBeenCalledWith(createdRef, buildDocument());
    expect(expense).toMatchObject({
      id: GENERATED_EXPENSE_ID,
      groupId: "user-a__group-1",
      deletedAt: null,
    });
  });

  it("copies the optional split metadata present on a row", async () => {
    mockSetDoc.mockResolvedValue(undefined);

    await createGroupExpenseOperation({
      ...createDto,
      splitMode: "shares",
      participants: [
        { userId: "user-a", shareCents: 400, weight: 2, percentageBps: 4000 },
        { userId: "user-b", shareCents: 600, weight: 3 },
      ],
    });

    expect(mockSetDoc).toHaveBeenCalledWith(createdRef, {
      ...buildDocument({ splitMode: "shares" }),
      participants: [
        { userId: "user-a", shareCents: 400, weight: 2, percentageBps: 4000 },
        { userId: "user-b", shareCents: 600, weight: 3 },
      ],
    });
  });

  it("fails when the written payload cannot be mapped", async () => {
    mockSetDoc.mockResolvedValue(undefined);

    await expect(
      createGroupExpenseOperation({ ...createDto, amountCents: 0 }),
    ).rejects.toMatchObject({ code: "EXPENSE_NOT_FOUND" });
  });
});

describe("updateGroupExpenseOperation", () => {
  it("writes only mutable fields and returns the stored document", async () => {
    mockUpdateDoc.mockResolvedValue(undefined);
    mockGetDoc.mockResolvedValue(
      documentSnapshot("expense-1", buildDocument({ ...updateDto })),
    );

    const expense = await updateGroupExpenseOperation("expense-1", updateDto);

    expect(mockUpdateDoc).toHaveBeenCalledWith(
      { id: "expense-1", path: "groupExpenses/expense-1" },
      {
        payerId: "user-b",
        amountCents: 2000,
        currency: "EUR",
        splitMode: "equal",
        participants: updateDto.participants,
        description: "Lunch",
        date: "2026-11-11",
        walletId: null,
        categoryId: null,
        updatedAt: "2026-11-11T10:00:00.000Z",
      },
    );
    expect(expense).toMatchObject({ id: "expense-1", amountCents: 2000 });
  });

  it("fails when the updated document cannot be read back", async () => {
    mockUpdateDoc.mockResolvedValue(undefined);
    mockGetDoc.mockResolvedValue(missingSnapshot());

    await expect(
      updateGroupExpenseOperation("expense-1", updateDto),
    ).rejects.toMatchObject({ code: "EXPENSE_NOT_FOUND" });
  });
});

describe("softDeleteGroupExpenseOperation", () => {
  it("stamps deletedAt and updatedAt without deleting the record", async () => {
    mockUpdateDoc.mockResolvedValue(undefined);

    await softDeleteGroupExpenseOperation(
      "expense-1",
      "2026-11-11T10:00:00.000Z",
    );

    expect(mockUpdateDoc).toHaveBeenCalledWith(
      { id: "expense-1", path: "groupExpenses/expense-1" },
      {
        deletedAt: "2026-11-11T10:00:00.000Z",
        updatedAt: "2026-11-11T10:00:00.000Z",
      },
    );
  });
});
