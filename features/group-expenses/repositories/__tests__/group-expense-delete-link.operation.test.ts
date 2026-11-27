import { beforeEach, describe, expect, it } from "@jest/globals";

import {
  EXPENSE_ID,
  NOW,
  VIEWER,
  WALLET_ID,
  activityRef,
  expenseRef,
  missingSnapshot,
  movementDocument,
  movementRef,
  setupLinkOperationMocks,
  snapshot,
  transactionGet,
  transactionSet,
  transactionUpdate,
  walletDocument,
  walletRef,
} from "./group-expense-link.test-helpers";
import { buildDocument } from "./group-expense-document.fixtures";
import { softDeleteGroupExpenseLinkOperation } from "../group-expense-link.operations";

beforeEach(setupLinkOperationMocks);

const options = { viewerUid: VIEWER, expenseId: EXPENSE_ID, deletedAt: NOW };

function storedLinkedExpense(overrides: Record<string, unknown> = {}) {
  return buildDocument({
    payerId: VIEWER,
    walletId: WALLET_ID,
    categoryId: "category-group",
    linkedTransactionId: "movement-1",
    ...overrides,
  });
}

describe("softDeleteGroupExpenseLinkOperation", () => {
  it("reverts the wallet and soft-deletes both records", async () => {
    transactionGet
      .mockResolvedValueOnce(snapshot(EXPENSE_ID, storedLinkedExpense()))
      .mockResolvedValueOnce(snapshot("movement-1", movementDocument()))
      .mockResolvedValueOnce(
        snapshot(WALLET_ID, walletDocument({ balance: 90 })),
      );

    await softDeleteGroupExpenseLinkOperation(options);

    expect(transactionUpdate).toHaveBeenCalledWith(walletRef(WALLET_ID), {
      balance: 100,
      updatedAt: NOW,
      revision: 1,
    });
    expect(transactionUpdate).toHaveBeenCalledWith(movementRef("movement-1"), {
      deletedAt: NOW,
      updatedAt: NOW,
      revision: 1,
    });
    expect(transactionUpdate).toHaveBeenCalledWith(expenseRef(EXPENSE_ID), {
      deletedAt: NOW,
      updatedAt: NOW,
      walletId: null,
      categoryId: null,
      linkedTransactionId: null,
      revision: 1,
    });
  });

  it("does nothing on a second delete", async () => {
    transactionGet.mockResolvedValueOnce(
      snapshot(EXPENSE_ID, storedLinkedExpense({ deletedAt: NOW })),
    );

    await softDeleteGroupExpenseLinkOperation(options);

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

    await softDeleteGroupExpenseLinkOperation(options);

    expect(transactionGet).toHaveBeenCalledTimes(2);
    expect(transactionUpdate).not.toHaveBeenCalledWith(
      walletRef("-1"),
      expect.anything(),
    );
    expect(transactionUpdate).toHaveBeenCalledWith(expenseRef(EXPENSE_ID), {
      deletedAt: NOW,
      updatedAt: NOW,
      walletId: null,
      categoryId: null,
      linkedTransactionId: null,
      revision: 1,
    });
  });

  it("skips the balance when the movement was already reverted", async () => {
    transactionGet
      .mockResolvedValueOnce(snapshot(EXPENSE_ID, storedLinkedExpense()))
      .mockResolvedValueOnce(
        snapshot("movement-1", movementDocument({ deletedAt: NOW })),
      );

    await softDeleteGroupExpenseLinkOperation(options);

    expect(transactionGet).toHaveBeenCalledTimes(2);
    expect(transactionUpdate).toHaveBeenCalledTimes(1);
  });

  it("rejects an unknown expense and a foreign movement", async () => {
    transactionGet.mockResolvedValueOnce(missingSnapshot());
    await expect(
      softDeleteGroupExpenseLinkOperation(options),
    ).rejects.toMatchObject({ code: "EXPENSE_NOT_FOUND" });

    setupLinkOperationMocks();
    transactionGet
      .mockResolvedValueOnce(snapshot(EXPENSE_ID, storedLinkedExpense()))
      .mockResolvedValueOnce(
        snapshot("movement-1", movementDocument({ ownerId: "user-b" })),
      );
    await expect(
      softDeleteGroupExpenseLinkOperation(options),
    ).rejects.toMatchObject({ code: "WALLET_NOT_OWNED" });
    expect(transactionUpdate).not.toHaveBeenCalled();
  });

  it("rejects a non-payer before reading a movement the rules deny", async () => {
    transactionGet.mockResolvedValueOnce(
      snapshot(EXPENSE_ID, storedLinkedExpense({ payerId: "user-b" })),
    );

    await expect(
      softDeleteGroupExpenseLinkOperation(options),
    ).rejects.toMatchObject({ code: "LINKED_MOVEMENT_FOREIGN" });
    expect(transactionGet).toHaveBeenCalledTimes(1);
    expect(transactionUpdate).not.toHaveBeenCalled();
  });

  it("leaves the group ledger untouched: only the stamps change", async () => {
    transactionGet
      .mockResolvedValueOnce(snapshot(EXPENSE_ID, storedLinkedExpense()))
      .mockResolvedValueOnce(snapshot("movement-1", movementDocument()))
      .mockResolvedValueOnce(
        snapshot(WALLET_ID, walletDocument({ balance: 90 })),
      );

    await softDeleteGroupExpenseLinkOperation(options);

    expect(transactionUpdate).toHaveBeenCalledWith(expenseRef(EXPENSE_ID), {
      deletedAt: NOW,
      updatedAt: NOW,
      walletId: null,
      categoryId: null,
      linkedTransactionId: null,
      revision: 1,
    });
    expect(transactionSet).toHaveBeenCalledWith(
      activityRef("activity-new"),
      expect.objectContaining({
        type: "expense-deleted",
        actorId: VIEWER,
        expenseId: EXPENSE_ID,
      }),
    );
  });

  it("writes no history event when the expense is already deleted", async () => {
    transactionGet.mockResolvedValueOnce(
      snapshot(EXPENSE_ID, storedLinkedExpense({ deletedAt: NOW })),
    );

    await softDeleteGroupExpenseLinkOperation(options);

    expect(transactionUpdate).not.toHaveBeenCalled();
    expect(transactionSet).not.toHaveBeenCalled();
  });

  it("closes a wallet-only legacy expense without reading a movement", async () => {
    transactionGet.mockResolvedValueOnce(
      snapshot(
        EXPENSE_ID,
        storedLinkedExpense({ linkedTransactionId: null }),
      ),
    );

    await softDeleteGroupExpenseLinkOperation(options);

    expect(transactionGet).toHaveBeenCalledTimes(1);
    expect(transactionUpdate).toHaveBeenCalledWith(expenseRef(EXPENSE_ID), {
      deletedAt: NOW,
      updatedAt: NOW,
      walletId: null,
      categoryId: null,
      linkedTransactionId: null,
      revision: 1,
    });
  });
});
