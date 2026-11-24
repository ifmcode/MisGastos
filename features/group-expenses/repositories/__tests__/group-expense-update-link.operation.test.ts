import { beforeEach, describe, expect, it } from "@jest/globals";

import {
  EXPENSE_ID,
  NOW,
  OTHER_WALLET_ID,
  VIEWER,
  WALLET_ID,
  activityRef,
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
import {
  buildDocument,
  buildUpdateDto,
} from "./group-expense-document.fixtures";
import { updateGroupExpenseLinkOperation } from "../group-expense-link.operations";

beforeEach(setupLinkOperationMocks);

const baseUpdate = buildUpdateDto();

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
  update: Partial<typeof baseUpdate>,
  viewerUid = VIEWER,
) {
  return updateGroupExpenseLinkOperation({
    viewerUid,
    expenseId: EXPENSE_ID,
    update: {
      ...baseUpdate,
      payerId: VIEWER,
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

describe("updateGroupExpenseLinkOperation - same wallet sync", () => {
  it("updates amount, date, description and category once", async () => {
    transactionGet
      .mockResolvedValueOnce(snapshot(EXPENSE_ID, storedLinkedExpense()))
      .mockResolvedValueOnce(snapshot("movement-1", movementDocument()))
      .mockResolvedValueOnce(snapshot(WALLET_ID, walletDocument({ balance: 90 })));

    const expense = await run({
      amountCents: 2000,
      date: "2026-11-12",
      description: "Lunch",
      categoryId: "category-new",
      walletId: WALLET_ID,
    });

    expect(lastUpdateOf(walletRef(WALLET_ID))).toMatchObject({ balance: 80 });
    expect(lastUpdateOf(movementRef("movement-1"))).toMatchObject({
      amount: 20,
      date: "2026-11-12",
      concept: "Lunch",
      categoryId: "category-new",
      walletId: WALLET_ID,
      groupExpenseId: EXPENSE_ID,
      createdAt: "2026-11-10T20:00:00.000Z",
      updatedAt: NOW,
      deletedAt: null,
    });
    expect(lastUpdateOf(expenseRef(EXPENSE_ID))).toMatchObject({
      amountCents: 2000,
      categoryId: "category-new",
      walletId: WALLET_ID,
      linkedTransactionId: "movement-1",
    });
    expect(expense).toMatchObject({ id: EXPENSE_ID, amountCents: 2000 });
  });

  it("does not double count when the payload repeats the stored values", async () => {
    transactionGet
      .mockResolvedValueOnce(snapshot(EXPENSE_ID, storedLinkedExpense()))
      .mockResolvedValueOnce(snapshot("movement-1", movementDocument()))
      .mockResolvedValueOnce(snapshot(WALLET_ID, walletDocument({ balance: 90 })));

    await run({ amountCents: 1000, walletId: WALLET_ID });

    expect(lastUpdateOf(walletRef(WALLET_ID))).toMatchObject({ balance: 90 });
  });

  it("moves the balance to another wallet exactly once", async () => {
    transactionGet
      .mockResolvedValueOnce(snapshot(EXPENSE_ID, storedLinkedExpense()))
      .mockResolvedValueOnce(snapshot("movement-1", movementDocument()))
      .mockResolvedValueOnce(
        snapshot(OTHER_WALLET_ID, walletDocument({ balance: 200 })),
      )
      .mockResolvedValueOnce(snapshot(WALLET_ID, walletDocument({ balance: 90 })));

    await run({
      amountCents: 1500,
      walletId: OTHER_WALLET_ID,
      categoryId: "category-group",
    });

    expect(lastUpdateOf(walletRef(WALLET_ID))).toMatchObject({ balance: 100 });
    expect(lastUpdateOf(walletRef(OTHER_WALLET_ID))).toMatchObject({
      balance: 185,
    });
    expect(lastUpdateOf(movementRef("movement-1"))).toMatchObject({
      walletId: OTHER_WALLET_ID,
      amount: 15,
    });
  });

  it("changes the wallet and the currency of the movement in one edit", async () => {
    transactionGet
      .mockResolvedValueOnce(snapshot(EXPENSE_ID, storedLinkedExpense()))
      .mockResolvedValueOnce(snapshot("movement-1", movementDocument()))
      .mockResolvedValueOnce(
        snapshot(OTHER_WALLET_ID, walletDocument({ balance: 200, currency: "USD" })),
      )
      .mockResolvedValueOnce(snapshot(WALLET_ID, walletDocument({ balance: 90 })));

    await run({
      amountCents: 1500,
      currency: "USD",
      walletId: OTHER_WALLET_ID,
    });

    expect(lastUpdateOf(walletRef(WALLET_ID))).toMatchObject({ balance: 100 });
    expect(lastUpdateOf(walletRef(OTHER_WALLET_ID))).toMatchObject({
      balance: 185,
    });
    expect(lastUpdateOf(movementRef("movement-1"))).toMatchObject({
      walletId: OTHER_WALLET_ID,
      currency: "USD",
      amount: 15,
      deletedAt: null,
    });
    expect(lastUpdateOf(expenseRef(EXPENSE_ID))).toMatchObject({
      currency: "USD",
      walletId: OTHER_WALLET_ID,
      linkedTransactionId: "movement-1",
    });
  });

  it("writes the linked movement only with the group expense key", async () => {
    transactionGet
      .mockResolvedValueOnce(snapshot(EXPENSE_ID, storedLinkedExpense()))
      .mockResolvedValueOnce(snapshot("movement-1", movementDocument()))
      .mockResolvedValueOnce(snapshot(WALLET_ID, walletDocument({ balance: 90 })));

    await run({ amountCents: 1000 });

    const movementData = lastUpdateOf(movementRef("movement-1")) ?? {};

    expect(movementData.groupExpenseId).toBe(EXPENSE_ID);
    expect(movementData).not.toHaveProperty("sharedExpenseId");
    expect(movementData).not.toHaveProperty("settlementId");
  });

  it("revives a soft-deleted movement instead of creating another one", async () => {
    transactionGet
      .mockResolvedValueOnce(snapshot(EXPENSE_ID, storedLinkedExpense()))
      .mockResolvedValueOnce(
        snapshot(
          "movement-1",
          movementDocument({ deletedAt: "2026-11-14T10:00:00.000Z" }),
        ),
      )
      .mockResolvedValueOnce(snapshot(WALLET_ID, walletDocument({ balance: 100 })));

    await run({ amountCents: 1200, walletId: WALLET_ID });

    // No movement is created, but the edit still appends its history event.
    expect(
      transactionSet.mock.calls.some(
        (call) => (call[0] as { kind?: string }).kind === "transaction",
      ),
    ).toBe(false);
    expect(transactionSet).toHaveBeenCalledWith(
      activityRef("activity-new"),
      expect.objectContaining({ type: "expense-updated", amountCents: 1200 }),
    );
    expect(lastUpdateOf(movementRef("movement-1"))).toMatchObject({
      amount: 12,
      deletedAt: null,
      createdAt: "2026-11-10T20:00:00.000Z",
    });
    expect(lastUpdateOf(walletRef(WALLET_ID))).toMatchObject({ balance: 88 });
  });

  it("links a social expense the viewer already paid without a previous movement", async () => {
    transactionGet
      .mockResolvedValueOnce(
        snapshot(
          EXPENSE_ID,
          storedLinkedExpense({
            walletId: null,
            categoryId: null,
            linkedTransactionId: null,
          }),
        ),
      )
      .mockResolvedValueOnce(snapshot(WALLET_ID, walletDocument({ balance: 100 })));

    await run({ amountCents: 1000 });

    expect(transactionSet).toHaveBeenCalledWith(
      movementRef("movement-new"),
      expect.objectContaining({ groupExpenseId: EXPENSE_ID }),
    );
    expect(lastUpdateOf(walletRef(WALLET_ID))).toMatchObject({ balance: 90 });
    expect(lastUpdateOf(expenseRef(EXPENSE_ID))).toMatchObject({
      walletId: WALLET_ID,
      linkedTransactionId: "movement-new",
    });
  });

  it("clears a link whose movement was already reverted without touching the balance", async () => {
    transactionGet
      .mockResolvedValueOnce(snapshot(EXPENSE_ID, storedLinkedExpense()))
      .mockResolvedValueOnce(
        snapshot(
          "movement-1",
          movementDocument({ deletedAt: "2026-11-14T10:00:00.000Z" }),
        ),
      );

    await run({ walletId: null, categoryId: null });

    expect(transactionGet).toHaveBeenCalledTimes(2);
    expect(lastUpdateOf(walletRef(WALLET_ID))).toBeUndefined();
    expect(lastUpdateOf(expenseRef(EXPENSE_ID))).toMatchObject({
      walletId: null,
      linkedTransactionId: null,
    });
  });
});
