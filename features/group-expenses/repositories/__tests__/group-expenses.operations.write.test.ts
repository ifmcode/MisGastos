import { beforeEach, describe, expect, it } from "@jest/globals";

// Imported first so the Firestore mocks are registered before the modules.
import {
  GENERATED_EXPENSE_ID,
  documentSnapshot,
  missingSnapshot,
  mockBatchCommit,
  mockBatchSet,
  mockDoc,
  mockTransactionGet,
  mockTransactionSet,
  mockTransactionUpdate,
  setupGroupExpensesRepositoryMocks,
} from "./group-expenses-repository.test-helpers";
import {
  createGroupExpenseOperation,
  updateGroupExpenseOperation,
} from "../group-expenses.operations";
import { softDeleteGroupExpenseOperation } from "../group-expense-delete.operation";
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
const activity = { kind: "activity", id: "activity-1" };

describe("createGroupExpenseOperation", () => {
  it("writes the document and its history event in one batch", async () => {
    const expense = await createGroupExpenseOperation(createDto);

    expect(mockDoc).toHaveBeenCalledWith({ path: "collection" });
    expect(mockBatchSet).toHaveBeenCalledWith(createdRef, buildDocument());
    expect(mockBatchSet).toHaveBeenCalledWith(activity, {
      type: "expense-created",
      groupId: "user-a__group-1",
      actorId: "user-a",
      targetUserId: null,
      targetName: null,
      expenseId: GENERATED_EXPENSE_ID,
      settlementId: null,
      fromUserId: null,
      toUserId: null,
      amountCents: 1000,
      currency: "EUR",
      description: "Dinner",
      changedFields: [],
      simplifyDebts: null,
      previousOwnerId: null,
      newOwnerId: null,
      createdAt: "2026-11-10T20:00:00.000Z",
    });
    expect(mockBatchCommit).toHaveBeenCalledTimes(1);
    expect(expense).toMatchObject({
      id: GENERATED_EXPENSE_ID,
      groupId: "user-a__group-1",
      deletedAt: null,
    });
  });

  it("copies the optional split metadata present on a row", async () => {
    await createGroupExpenseOperation({
      ...createDto,
      splitMode: "shares",
      participants: [
        { userId: "user-a", shareCents: 400, weight: 2, percentageBps: 4000 },
        { userId: "user-b", shareCents: 600, weight: 3 },
      ],
    });

    expect(mockBatchSet).toHaveBeenCalledWith(createdRef, {
      ...buildDocument({ splitMode: "shares" }),
      participants: [
        { userId: "user-a", shareCents: 400, weight: 2, percentageBps: 4000 },
        { userId: "user-b", shareCents: 600, weight: 3 },
      ],
    });
  });

  it("fails when the written payload cannot be mapped", async () => {
    await expect(
      createGroupExpenseOperation({ ...createDto, amountCents: 0 }),
    ).rejects.toMatchObject({ code: "EXPENSE_NOT_FOUND" });
  });
});

describe("updateGroupExpenseOperation", () => {
  it("updates the mutable fields and appends the edit event atomically", async () => {
    mockTransactionGet.mockResolvedValue(
      documentSnapshot("expense-1", buildDocument()),
    );

    const expense = await updateGroupExpenseOperation(
      "expense-1",
      updateDto,
      "user-a",
    );

    expect(mockTransactionUpdate).toHaveBeenCalledWith(
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
    expect(mockTransactionSet).toHaveBeenCalledWith(
      activity,
      expect.objectContaining({
        type: "expense-updated",
        actorId: "user-a",
        expenseId: "expense-1",
        amountCents: 2000,
        description: "Lunch",
      }),
    );
    expect(expense).toMatchObject({ id: "expense-1", amountCents: 2000 });
  });

  it("fails when the stored document is missing", async () => {
    mockTransactionGet.mockResolvedValue(missingSnapshot());

    await expect(
      updateGroupExpenseOperation("expense-1", updateDto, "user-a"),
    ).rejects.toMatchObject({ code: "EXPENSE_NOT_FOUND" });
    expect(mockTransactionUpdate).not.toHaveBeenCalled();
  });
});

describe("softDeleteGroupExpenseOperation", () => {
  it("stamps the deletion and appends the delete event", async () => {
    mockTransactionGet.mockResolvedValue(
      documentSnapshot("expense-1", buildDocument()),
    );

    await softDeleteGroupExpenseOperation(
      "expense-1",
      "2026-11-11T10:00:00.000Z",
      "user-a",
    );

    expect(mockTransactionUpdate).toHaveBeenCalledWith(
      { id: "expense-1", path: "groupExpenses/expense-1" },
      {
        deletedAt: "2026-11-11T10:00:00.000Z",
        updatedAt: "2026-11-11T10:00:00.000Z",
      },
    );
    expect(mockTransactionSet).toHaveBeenCalledWith(
      activity,
      expect.objectContaining({
        type: "expense-deleted",
        actorId: "user-a",
        amountCents: 1000,
        description: "Dinner",
        createdAt: "2026-11-11T10:00:00.000Z",
      }),
    );
  });

  it("writes nothing when the expense is already deleted", async () => {
    mockTransactionGet.mockResolvedValue(
      documentSnapshot(
        "expense-1",
        buildDocument({ deletedAt: "2026-11-10T20:00:00.000Z" }),
      ),
    );

    await softDeleteGroupExpenseOperation(
      "expense-1",
      "2026-11-11T10:00:00.000Z",
      "user-a",
    );

    expect(mockTransactionUpdate).not.toHaveBeenCalled();
    expect(mockTransactionSet).not.toHaveBeenCalled();
  });

  it("fails for a missing expense", async () => {
    mockTransactionGet.mockResolvedValue(missingSnapshot());

    await expect(
      softDeleteGroupExpenseOperation(
        "expense-1",
        "2026-11-11T10:00:00.000Z",
        "user-a",
      ),
    ).rejects.toMatchObject({ code: "EXPENSE_NOT_FOUND" });
  });
});
