import { beforeEach, describe, expect, it } from "@jest/globals";

import {
  EXPENSE_ID,
  NOW,
  WALLET_ID,
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
} from "./shared-expense-link.test-helpers";
import { buildCreateExpenseDto } from "./shared-expense-document.fixtures";
import {
  createSharedExpenseLinkOperation,
  softDeleteSharedExpenseLinkOperation,
} from "../shared-expense-link.operations";
import { buildExpenseDocument } from "./shared-expense-document.fixtures";
import { movementDocument } from "./shared-expense-link.test-helpers";

beforeEach(setupLinkOperationMocks);

const linkedDto = {
  ...buildCreateExpenseDto(),
  amountCents: 1000,
  walletId: WALLET_ID,
  categoryId: "category-shared",
  updatedAt: NOW,
  createdAt: NOW,
};

function storedLinkedExpense(overrides: Record<string, unknown> = {}) {
  return buildExpenseDocument({
    amountCents: 1000,
    walletId: WALLET_ID,
    categoryId: "category-shared",
    linkedTransactionId: "movement-1",
    ...overrides,
  });
}

describe("createSharedExpenseLinkOperation", () => {
  it("writes the expense, its movement and the balance in one transaction", async () => {
    transactionGet.mockResolvedValueOnce(
      snapshot(WALLET_ID, walletDocument({ balance: 100 })),
    );

    const expense = await createSharedExpenseLinkOperation(linkedDto);

    expect(mockRunTransaction).toHaveBeenCalledTimes(1);
    expect(transactionSet).toHaveBeenCalledWith(
      expenseRef("expense-new"),
      expect.objectContaining({
        walletId: WALLET_ID,
        categoryId: "category-shared",
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
        categoryId: "category-shared",
        concept: "Dinner",
        date: "2026-11-10",
        ownerId: "user-a",
        sharedExpenseId: "expense-new",
        deletedAt: null,
      }),
    );
    expect(transactionUpdate).toHaveBeenCalledWith(walletRef(WALLET_ID), {
      balance: 90,
      updatedAt: NOW,
    });
    expect(expense).toMatchObject({
      id: "expense-new",
      walletId: WALLET_ID,
      linkedTransactionId: "movement-new",
    });
  });

  it("rejects an insufficient balance without writing anything", async () => {
    transactionGet.mockResolvedValueOnce(
      snapshot(WALLET_ID, walletDocument({ balance: 5 })),
    );

    await expect(
      createSharedExpenseLinkOperation(linkedDto),
    ).rejects.toMatchObject({ code: "INSUFFICIENT_BALANCE" });
    expect(transactionSet).not.toHaveBeenCalled();
    expect(transactionUpdate).not.toHaveBeenCalled();
  });

  it("rejects a missing, foreign or mismatched wallet", async () => {
    transactionGet.mockResolvedValueOnce(missingSnapshot()).mockResolvedValueOnce(
      snapshot(WALLET_ID, walletDocument({ ownerId: "user-b" })),
    ).mockResolvedValueOnce(
      snapshot(WALLET_ID, walletDocument({ currency: "USD" })),
    );

    await expect(
      createSharedExpenseLinkOperation(linkedDto),
    ).rejects.toMatchObject({ code: "WALLET_NOT_FOUND" });
    await expect(
      createSharedExpenseLinkOperation(linkedDto),
    ).rejects.toMatchObject({ code: "WALLET_NOT_OWNED" });
    await expect(
      createSharedExpenseLinkOperation(linkedDto),
    ).rejects.toMatchObject({ code: "CURRENCY_MISMATCH" });
    expect(transactionSet).not.toHaveBeenCalled();
  });

  it("requires a wallet on the linked path", async () => {
    await expect(
      createSharedExpenseLinkOperation({ ...linkedDto, walletId: null }),
    ).rejects.toMatchObject({ code: "WALLET_NOT_FOUND" });
    expect(mockRunTransaction).not.toHaveBeenCalled();
  });
});

describe("softDeleteSharedExpenseLinkOperation", () => {
  const options = { viewerUid: "user-a", expenseId: EXPENSE_ID, deletedAt: NOW };

  it("reverts the wallet and soft-deletes both records", async () => {
    transactionGet
      .mockResolvedValueOnce(snapshot(EXPENSE_ID, storedLinkedExpense()))
      .mockResolvedValueOnce(snapshot("movement-1", movementDocument()))
      .mockResolvedValueOnce(
        snapshot(WALLET_ID, walletDocument({ balance: 90 })),
      );

    await softDeleteSharedExpenseLinkOperation(options);

    expect(transactionUpdate).toHaveBeenCalledWith(walletRef(WALLET_ID), {
      balance: 100,
      updatedAt: NOW,
    });
    expect(transactionUpdate).toHaveBeenCalledWith(movementRef("movement-1"), {
      deletedAt: NOW,
      updatedAt: NOW,
    });
    expect(transactionUpdate).toHaveBeenCalledWith(expenseRef(EXPENSE_ID), {
      deletedAt: NOW,
      updatedAt: NOW,
      linkedTransactionId: null,
    });
  });

  it("does nothing on a second delete", async () => {
    transactionGet.mockResolvedValueOnce(
      snapshot(EXPENSE_ID, storedLinkedExpense({ deletedAt: NOW })),
    );

    await softDeleteSharedExpenseLinkOperation(options);

    expect(transactionGet).toHaveBeenCalledTimes(1);
    expect(transactionUpdate).not.toHaveBeenCalled();
  });

  it("soft-deletes the expense when its wallet was permanently deleted", async () => {
    transactionGet
      .mockResolvedValueOnce(
        snapshot(EXPENSE_ID, storedLinkedExpense({ walletId: "-1" })),
      )
      .mockResolvedValueOnce(
        snapshot("movement-1", movementDocument({ walletId: "-1" })),
      );

    await softDeleteSharedExpenseLinkOperation(options);

    expect(transactionGet).toHaveBeenCalledTimes(2);
    expect(transactionUpdate).not.toHaveBeenCalledWith(
      walletRef("-1"),
      expect.anything(),
    );
    expect(transactionUpdate).toHaveBeenCalledWith(expenseRef(EXPENSE_ID), {
      deletedAt: NOW,
      updatedAt: NOW,
      linkedTransactionId: null,
    });
  });

  it("skips the balance when the movement was already reverted", async () => {
    transactionGet
      .mockResolvedValueOnce(snapshot(EXPENSE_ID, storedLinkedExpense()))
      .mockResolvedValueOnce(
        snapshot("movement-1", movementDocument({ deletedAt: NOW })),
      );

    await softDeleteSharedExpenseLinkOperation(options);

    expect(transactionGet).toHaveBeenCalledTimes(2);
    expect(transactionUpdate).toHaveBeenCalledTimes(1);
  });

  it("rejects an unknown expense and a foreign movement", async () => {
    transactionGet.mockResolvedValueOnce(missingSnapshot());
    await expect(softDeleteSharedExpenseLinkOperation(options)).rejects.toMatchObject(
      { code: "EXPENSE_NOT_FOUND" },
    );

    setupLinkOperationMocks();
    transactionGet
      .mockResolvedValueOnce(snapshot(EXPENSE_ID, storedLinkedExpense()))
      .mockResolvedValueOnce(
        snapshot("movement-1", movementDocument({ ownerId: "user-b" })),
      );
    await expect(softDeleteSharedExpenseLinkOperation(options)).rejects.toMatchObject(
      { code: "WALLET_NOT_OWNED" },
    );
    expect(transactionUpdate).not.toHaveBeenCalled();
  });
});
