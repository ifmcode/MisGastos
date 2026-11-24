import { beforeEach, describe, expect, it } from "@jest/globals";

// Imported first so the Firestore mocks are registered before the modules.
import {
  NOW,
  VIEWER,
  WALLET_ID,
  activityRef,
  expenseRef,
  missingSnapshot,
  mockRunTransaction,
  movementRef,
  setupLinkOperationMocks,
  snapshot,
  transactionGet,
  transactionSet,
  transactionUpdate,
  walletDocument,
  walletRef,
} from "./group-expense-link.test-helpers";
import { buildCreateDto } from "./group-expense-document.fixtures";
import { createGroupExpenseLinkOperation } from "../group-expense-link.operations";

beforeEach(setupLinkOperationMocks);

const linkedDto = {
  ...buildCreateDto(),
  amountCents: 1000,
  walletId: WALLET_ID,
  categoryId: "category-group",
  updatedAt: NOW,
  createdAt: NOW,
};

describe("createGroupExpenseLinkOperation", () => {
  it("writes the expense, its movement and the balance in one transaction", async () => {
    transactionGet.mockResolvedValueOnce(
      snapshot(WALLET_ID, walletDocument({ balance: 100 })),
    );

    const expense = await createGroupExpenseLinkOperation(linkedDto);

    expect(mockRunTransaction).toHaveBeenCalledTimes(1);
    expect(transactionSet).toHaveBeenCalledWith(
      expenseRef("group-expense-new"),
      expect.objectContaining({
        groupId: "user-a__group-1",
        walletId: WALLET_ID,
        categoryId: "category-group",
        linkedTransactionId: "movement-new",
      }),
    );
    expect(transactionSet).toHaveBeenCalledWith(
      movementRef("movement-new"),
      expect.objectContaining({
        type: "expense",
        amount: 10,
        currency: "EUR",
        walletId: WALLET_ID,
        categoryId: "category-group",
        concept: "Dinner",
        date: "2026-11-10",
        ownerId: VIEWER,
        groupExpenseId: "group-expense-new",
        deletedAt: null,
      }),
    );
    expect(transactionUpdate).toHaveBeenCalledWith(walletRef(WALLET_ID), {
      balance: 90,
      updatedAt: NOW,
    });
    expect(transactionSet).toHaveBeenCalledWith(
      activityRef("activity-new"),
      expect.objectContaining({
        type: "expense-created",
        actorId: VIEWER,
        expenseId: "group-expense-new",
        amountCents: 1000,
      }),
    );
    expect(expense).toMatchObject({
      id: "group-expense-new",
      walletId: WALLET_ID,
      linkedTransactionId: "movement-new",
    });
  });

  it("rejects an insufficient balance without writing anything", async () => {
    transactionGet.mockResolvedValueOnce(
      snapshot(WALLET_ID, walletDocument({ balance: 5 })),
    );

    await expect(
      createGroupExpenseLinkOperation(linkedDto),
    ).rejects.toMatchObject({ code: "INSUFFICIENT_BALANCE" });
    expect(transactionSet).not.toHaveBeenCalled();
    expect(transactionUpdate).not.toHaveBeenCalled();
  });

  it("rejects a missing, foreign or mismatched wallet", async () => {
    transactionGet
      .mockResolvedValueOnce(missingSnapshot())
      .mockResolvedValueOnce(
        snapshot(WALLET_ID, walletDocument({ ownerId: "user-b" })),
      )
      .mockResolvedValueOnce(
        snapshot(WALLET_ID, walletDocument({ currency: "USD" })),
      );

    await expect(
      createGroupExpenseLinkOperation(linkedDto),
    ).rejects.toMatchObject({ code: "WALLET_NOT_FOUND" });
    await expect(
      createGroupExpenseLinkOperation(linkedDto),
    ).rejects.toMatchObject({ code: "WALLET_NOT_OWNED" });
    await expect(
      createGroupExpenseLinkOperation(linkedDto),
    ).rejects.toMatchObject({ code: "CURRENCY_MISMATCH" });
    expect(transactionSet).not.toHaveBeenCalled();
  });

  it("requires a wallet on the linked path", async () => {
    await expect(
      createGroupExpenseLinkOperation({ ...linkedDto, walletId: null }),
    ).rejects.toMatchObject({ code: "WALLET_NOT_FOUND" });
    expect(mockRunTransaction).not.toHaveBeenCalled();
  });

  it("requires the category that backs the linked movement", async () => {
    await expect(
      createGroupExpenseLinkOperation({ ...linkedDto, categoryId: null }),
    ).rejects.toMatchObject({ code: "CATEGORY_REQUIRED" });
    expect(mockRunTransaction).not.toHaveBeenCalled();
  });

  it("rejects an expense that cannot be mapped without returning it", async () => {
    transactionGet.mockResolvedValueOnce(
      snapshot(WALLET_ID, walletDocument({ balance: 100 })),
    );

    await expect(
      createGroupExpenseLinkOperation({ ...linkedDto, amountCents: 0 }),
    ).rejects.toMatchObject({ code: "EXPENSE_NOT_FOUND" });
    expect(transactionSet).toHaveBeenCalledTimes(3);
  });

  it("never writes the expense id into a shared-expense key", async () => {
    transactionGet.mockResolvedValueOnce(
      snapshot(WALLET_ID, walletDocument({ balance: 100 })),
    );

    await createGroupExpenseLinkOperation(linkedDto);

    const movementData = transactionSet.mock.calls.find(
      (call) => (call[0] as { kind?: string }).kind === "transaction",
    )?.[1] as Record<string, unknown>;

    expect(movementData.groupExpenseId).toBe("group-expense-new");
    expect(movementData).not.toHaveProperty("sharedExpenseId");
    expect(movementData).not.toHaveProperty("settlementId");
  });
});
