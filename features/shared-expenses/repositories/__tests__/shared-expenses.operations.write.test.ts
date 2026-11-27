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
  setupSharedExpensesRepositoryMocks,
} from "./shared-expenses-repository.test-helpers";
import {
  createSharedExpenseOperation,
  softDeleteSharedExpenseOperation,
  updateSharedExpenseOperation,
} from "../shared-expenses.operations";
import {
  buildCreateExpenseDto,
  buildExpenseDocument,
  buildUpdateExpenseDto,
} from "./shared-expense-document.fixtures";

beforeEach(setupSharedExpensesRepositoryMocks);

const createDto = buildCreateExpenseDto();
const updateDto = buildUpdateExpenseDto();

const createdRef = {
  id: GENERATED_EXPENSE_ID,
  path: `sharedExpenses/${GENERATED_EXPENSE_ID}`,
};

describe("createSharedExpenseOperation", () => {
  it("generates the id and stores the full document", async () => {
    mockSetDoc.mockResolvedValue(undefined);

    const expense = await createSharedExpenseOperation(createDto);

    expect(mockDoc).toHaveBeenCalledWith({ path: "collection" });
    expect(mockSetDoc).toHaveBeenCalledWith(createdRef, buildExpenseDocument());
    expect(expense).toMatchObject({
      id: GENERATED_EXPENSE_ID,
      pairId: "user-a__user-b",
      deletedAt: null,
    });
  });

  it("copies the optional split metadata present on a row", async () => {
    mockSetDoc.mockResolvedValue(undefined);

    await createSharedExpenseOperation({
      ...createDto,
      splitMode: "shares",
      participants: [
        { userId: "user-a", shareCents: 400, weight: 2, percentageBps: 4000 },
        { userId: "user-b", shareCents: 600, weight: 3 },
      ],
    });

    expect(mockSetDoc).toHaveBeenCalledWith(createdRef, {
      ...buildExpenseDocument({ splitMode: "shares" }),
      participants: [
        { userId: "user-a", shareCents: 400, weight: 2, percentageBps: 4000 },
        { userId: "user-b", shareCents: 600, weight: 3 },
      ],
    });
  });

  it("fails when the written payload cannot be mapped", async () => {
    mockSetDoc.mockResolvedValue(undefined);

    await expect(
      createSharedExpenseOperation({ ...createDto, amountCents: 0 }),
    ).rejects.toMatchObject({ code: "EXPENSE_NOT_FOUND" });
  });
});

describe("updateSharedExpenseOperation", () => {
  it("writes only mutable fields and returns the stored document", async () => {
    mockUpdateDoc.mockResolvedValue(undefined);
    mockGetDoc.mockResolvedValue(
      documentSnapshot("expense-1", buildExpenseDocument(updateDto)),
    );

    const expense = await updateSharedExpenseOperation("expense-1", updateDto);

    expect(mockUpdateDoc).toHaveBeenCalledWith(
      { id: "expense-1", path: "sharedExpenses/expense-1" },
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
        revision: 1,
      },
    );
    expect(expense).toMatchObject({ id: "expense-1", amountCents: 2000 });
  });

  it("fails when the updated document cannot be read back", async () => {
    mockUpdateDoc.mockResolvedValue(undefined);
    mockGetDoc.mockResolvedValue(missingSnapshot());

    await expect(
      updateSharedExpenseOperation("expense-1", updateDto),
    ).rejects.toMatchObject({ code: "EXPENSE_NOT_FOUND" });
  });

  it("rejects an already deleted expense", async () => {
    mockGetDoc.mockResolvedValue(
      documentSnapshot(
        "expense-1",
        buildExpenseDocument({ deletedAt: "2026-11-10T20:00:00.000Z" }),
      ),
    );

    await expect(
      updateSharedExpenseOperation("expense-1", updateDto),
    ).rejects.toMatchObject({ code: "ALREADY_DELETED" });
  });

  it("writes the link id only when the caller supplies it", async () => {
    mockUpdateDoc.mockResolvedValue(undefined);
    mockGetDoc.mockResolvedValue(
      documentSnapshot("expense-1", buildExpenseDocument(updateDto)),
    );

    await updateSharedExpenseOperation("expense-1", {
      ...updateDto,
      linkedTransactionId: "movement-1",
    });

    expect(mockUpdateDoc).toHaveBeenCalledWith(
      { id: "expense-1", path: "sharedExpenses/expense-1" },
      expect.objectContaining({ linkedTransactionId: "movement-1" }),
    );
  });
});

describe("softDeleteSharedExpenseOperation", () => {
  it("stamps deletedAt and updatedAt without deleting the record", async () => {
    mockUpdateDoc.mockResolvedValue(undefined);

    await softDeleteSharedExpenseOperation(
      "expense-1",
      "2026-11-11T10:00:00.000Z",
    );

    expect(mockUpdateDoc).toHaveBeenCalledWith(
      { id: "expense-1", path: "sharedExpenses/expense-1" },
      {
        deletedAt: "2026-11-11T10:00:00.000Z",
        updatedAt: "2026-11-11T10:00:00.000Z",
        revision: 1,
      },
    );
  });
});
