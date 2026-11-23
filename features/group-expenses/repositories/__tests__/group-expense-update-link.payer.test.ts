import { beforeEach, describe, expect, it } from "@jest/globals";

import {
  EXPENSE_ID,
  NOW,
  VIEWER,
  WALLET_ID,
  expenseRef,
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
import { updateGroupExpenseLinkOperation } from "../group-expense-link.operations";

beforeEach(setupLinkOperationMocks);

/** Stored linked expense paid by the viewer; override only the field under test. */
function storedLinkedExpense(overrides: Record<string, unknown> = {}) {
  return buildDocument({
    payerId: VIEWER,
    amountCents: 1000,
    walletId: WALLET_ID,
    categoryId: "category-group",
    linkedTransactionId: "movement-1",
    ...overrides,
  });
}

function run(
  update: Record<string, unknown>,
  viewerUid = VIEWER,
) {
  return updateGroupExpenseLinkOperation({
    viewerUid,
    expenseId: EXPENSE_ID,
    update: {
      payerId: VIEWER,
      amountCents: 1000,
      currency: "EUR",
      splitMode: "equal",
      participants: [
        { userId: "user-a", shareCents: 500 },
        { userId: "user-b", shareCents: 500 },
      ],
      description: "Dinner",
      date: "2026-11-10",
      walletId: WALLET_ID,
      categoryId: "category-group",
      updatedAt: NOW,
      ...update,
    },
  });
}

function lastUpdateOf(reference: { kind: string; id: string }) {
  const call = [...transactionUpdate.mock.calls]
    .reverse()
    .find((entry) => {
      const ref = entry[0] as { kind?: string; id?: string } | undefined;

      return ref?.kind === reference.kind && ref?.id === reference.id;
    });

  return call?.[1] as Record<string, unknown> | undefined;
}

function mockRevertableExpense() {
  transactionGet
    .mockResolvedValueOnce(snapshot(EXPENSE_ID, storedLinkedExpense()))
    .mockResolvedValueOnce(snapshot("movement-1", movementDocument()))
    .mockResolvedValueOnce(snapshot(WALLET_ID, walletDocument({ balance: 90 })));
}

describe("updateGroupExpenseLinkOperation - link cleared", () => {
  it("reverts once and soft-deletes both records when the toggle turns off", async () => {
    mockRevertableExpense();

    await run({ walletId: null, categoryId: null });

    expect(lastUpdateOf(walletRef(WALLET_ID))).toMatchObject({ balance: 100 });
    expect(lastUpdateOf(movementRef("movement-1"))).toMatchObject({
      deletedAt: NOW,
      updatedAt: NOW,
    });
    expect(lastUpdateOf(expenseRef(EXPENSE_ID))).toMatchObject({
      walletId: null,
      categoryId: null,
      linkedTransactionId: null,
    });
    expect(transactionSet).not.toHaveBeenCalled();
  });

  it("reverts a currency change with no compatible wallet and saves social-only", async () => {
    mockRevertableExpense();

    await run({ walletId: null, categoryId: null, currency: "USD" });

    expect(lastUpdateOf(walletRef(WALLET_ID))).toMatchObject({ balance: 100 });
    expect(lastUpdateOf(movementRef("movement-1"))).toMatchObject({
      deletedAt: NOW,
    });
    expect(lastUpdateOf(expenseRef(EXPENSE_ID))).toMatchObject({
      currency: "USD",
      walletId: null,
      categoryId: null,
      linkedTransactionId: null,
    });
  });

  it("reverts and soft-deletes when another member becomes the payer", async () => {
    mockRevertableExpense();

    await run({ payerId: "user-b", walletId: null, categoryId: null });

    expect(lastUpdateOf(walletRef(WALLET_ID))).toMatchObject({ balance: 100 });
    expect(lastUpdateOf(movementRef("movement-1"))).toMatchObject({
      deletedAt: NOW,
    });
    expect(lastUpdateOf(expenseRef(EXPENSE_ID))).toMatchObject({
      payerId: "user-b",
      linkedTransactionId: null,
    });
  });

  it("creates the movement when the viewer takes over a social expense", async () => {
    transactionGet
      .mockResolvedValueOnce(
        snapshot(
          EXPENSE_ID,
          storedLinkedExpense({
            payerId: "user-b",
            walletId: null,
            categoryId: null,
            linkedTransactionId: null,
          }),
        ),
      )
      .mockResolvedValueOnce(snapshot(WALLET_ID, walletDocument({ balance: 100 })));

    await run({ payerId: VIEWER, amountCents: 1000 });

    expect(transactionSet).toHaveBeenCalledWith(
      movementRef("movement-new"),
      expect.objectContaining({
        type: "expense",
        amount: 10,
        walletId: WALLET_ID,
        ownerId: VIEWER,
        groupExpenseId: EXPENSE_ID,
      }),
    );
    expect(lastUpdateOf(walletRef(WALLET_ID))).toMatchObject({ balance: 90 });
    expect(lastUpdateOf(expenseRef(EXPENSE_ID))).toMatchObject({
      payerId: VIEWER,
      linkedTransactionId: "movement-new",
    });
  });
});
