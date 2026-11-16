import { beforeEach, describe, expect, it } from "@jest/globals";

import type { UpdateSharedExpenseDto } from "../../types/shared-expense.types";
import {
  EXPENSE_ID,
  NOW,
  WALLET_ID,
  movementDocument,
  missingSnapshot,
  setupLinkOperationMocks,
  snapshot,
  transactionGet,
  transactionSet,
  transactionUpdate,
  walletDocument,
} from "./shared-expense-link.test-helpers";
import {
  buildExpenseDocument,
  buildUpdateExpenseDto,
} from "./shared-expense-document.fixtures";
import { updateSharedExpenseLinkOperation } from "../shared-expense-link.operations";

beforeEach(setupLinkOperationMocks);

const baseUpdate = {
  ...buildUpdateExpenseDto(),
  payerId: "user-a",
  walletId: WALLET_ID,
  categoryId: "category-shared",
  updatedAt: NOW,
};

function storedLinkedExpense(overrides: Record<string, unknown> = {}) {
  return buildExpenseDocument({
    payerId: "user-a",
    amountCents: 1000,
    walletId: WALLET_ID,
    categoryId: "category-shared",
    linkedTransactionId: "movement-1",
    ...overrides,
  });
}

function run(
  update: Partial<UpdateSharedExpenseDto>,
  viewerUid = "user-a",
) {
  return updateSharedExpenseLinkOperation({
    viewerUid,
    expenseId: EXPENSE_ID,
    update: { ...baseUpdate, ...update },
  });
}

function mockLinkedExpense(expense = storedLinkedExpense()) {
  transactionGet
    .mockResolvedValueOnce(snapshot(EXPENSE_ID, expense))
    .mockResolvedValueOnce(snapshot("movement-1", movementDocument()));
}

describe("updateSharedExpenseLinkOperation - failures", () => {
  it("rejects an unknown or malformed expense", async () => {
    transactionGet.mockResolvedValueOnce(missingSnapshot());

    await expect(run({})).rejects.toMatchObject({ code: "EXPENSE_NOT_FOUND" });
    expect(transactionUpdate).not.toHaveBeenCalled();
  });

  it("rejects a currency change that would orphan the linked movement", async () => {
    mockLinkedExpense();

    await expect(
      run({ walletId: null, categoryId: null, currency: "USD" }),
    ).rejects.toMatchObject({ code: "CURRENCY_MISMATCH" });
    expect(transactionSet).not.toHaveBeenCalled();
    expect(transactionUpdate).not.toHaveBeenCalled();
  });

  it("rejects a wallet without enough balance before writing", async () => {
    transactionGet
      .mockResolvedValueOnce(snapshot(EXPENSE_ID, storedLinkedExpense()))
      .mockResolvedValueOnce(snapshot("movement-1", movementDocument()))
      .mockResolvedValueOnce(snapshot(WALLET_ID, walletDocument({ balance: 10 })));

    await expect(run({ amountCents: 3000 })).rejects.toMatchObject({
      code: "INSUFFICIENT_BALANCE",
    });
    expect(transactionSet).not.toHaveBeenCalled();
    expect(transactionUpdate).not.toHaveBeenCalled();
  });

  it("rejects a movement owned by the other participant", async () => {
    transactionGet
      .mockResolvedValueOnce(snapshot(EXPENSE_ID, storedLinkedExpense()))
      .mockResolvedValueOnce(
        snapshot("movement-1", movementDocument({ ownerId: "user-b" })),
      );

    await expect(run({}, "user-b")).rejects.toMatchObject({
      code: "LINKED_MOVEMENT_NOT_REVERTIBLE",
    });
    expect(transactionUpdate).not.toHaveBeenCalled();
  });

  it("rejects a wallet selected while the friend pays", async () => {
    transactionGet.mockResolvedValueOnce(
      snapshot(
        EXPENSE_ID,
        storedLinkedExpense({ linkedTransactionId: null, walletId: null }),
      ),
    );

    await expect(run({ payerId: "user-b" })).rejects.toMatchObject({
      code: "WALLET_NOT_OWNED",
    });
  });

  it("rejects a missing, foreign or mismatched destination wallet", async () => {
    transactionGet.mockResolvedValueOnce(
      snapshot(EXPENSE_ID, storedLinkedExpense({ linkedTransactionId: null })),
    );
    transactionGet.mockResolvedValueOnce(missingSnapshot());
    await expect(run({})).rejects.toMatchObject({ code: "WALLET_NOT_FOUND" });

    setupLinkOperationMocks();
    transactionGet
      .mockResolvedValueOnce(
        snapshot(EXPENSE_ID, storedLinkedExpense({ linkedTransactionId: null })),
      )
      .mockResolvedValueOnce(
        snapshot(WALLET_ID, walletDocument({ ownerId: "user-b" })),
      );
    await expect(run({})).rejects.toMatchObject({ code: "WALLET_NOT_OWNED" });

    setupLinkOperationMocks();
    transactionGet
      .mockResolvedValueOnce(
        snapshot(EXPENSE_ID, storedLinkedExpense({ linkedTransactionId: null })),
      )
      .mockResolvedValueOnce(
        snapshot(WALLET_ID, walletDocument({ currency: "USD" })),
      );
    await expect(run({})).rejects.toMatchObject({ code: "CURRENCY_MISMATCH" });
    expect(transactionUpdate).not.toHaveBeenCalled();
  });
});
