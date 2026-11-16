import { beforeEach, describe, expect, it } from "@jest/globals";

import {
  EXPENSE_ID,
  NOW,
  OTHER_WALLET_ID,
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
} from "./shared-expense-link.test-helpers";
import {
  buildExpenseDocument,
  buildUpdateExpenseDto,
} from "./shared-expense-document.fixtures";
import { updateSharedExpenseLinkOperation } from "../shared-expense-link.operations";

beforeEach(setupLinkOperationMocks);

const baseUpdate = buildUpdateExpenseDto();

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
  update: Partial<typeof baseUpdate>,
  viewerUid = "user-a",
) {
  return updateSharedExpenseLinkOperation({
    viewerUid,
    expenseId: EXPENSE_ID,
    update: { ...baseUpdate, payerId: "user-a", updatedAt: NOW, ...update },
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

describe("updateSharedExpenseLinkOperation - same wallet sync", () => {
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
      categoryId: "category-shared",
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
});

describe("updateSharedExpenseLinkOperation - payer changes", () => {
  it("reverts and soft-deletes the movement when the friend becomes the payer", async () => {
    transactionGet
      .mockResolvedValueOnce(snapshot(EXPENSE_ID, storedLinkedExpense()))
      .mockResolvedValueOnce(snapshot("movement-1", movementDocument()))
      .mockResolvedValueOnce(snapshot(WALLET_ID, walletDocument({ balance: 90 })));

    await run({ payerId: "user-b", walletId: null, categoryId: null });

    expect(lastUpdateOf(walletRef(WALLET_ID))).toMatchObject({ balance: 100 });
    expect(lastUpdateOf(movementRef("movement-1"))).toMatchObject({
      deletedAt: NOW,
      updatedAt: NOW,
    });
    expect(lastUpdateOf(expenseRef(EXPENSE_ID))).toMatchObject({
      payerId: "user-b",
      walletId: null,
      categoryId: null,
      linkedTransactionId: null,
    });
    expect(transactionSet).not.toHaveBeenCalled();
  });

  it("creates the movement when the viewer becomes the payer", async () => {
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
      .mockResolvedValueOnce(
        snapshot(WALLET_ID, walletDocument({ balance: 100 })),
      );

    await run({
      payerId: "user-a",
      walletId: WALLET_ID,
      categoryId: "category-shared",
      amountCents: 1000,
    });

    expect(transactionSet).toHaveBeenCalledWith(
      movementRef("movement-new"),
      expect.objectContaining({
        type: "expense",
        amount: 10,
        walletId: WALLET_ID,
        ownerId: "user-a",
        sharedExpenseId: EXPENSE_ID,
      }),
    );
    expect(lastUpdateOf(walletRef(WALLET_ID))).toMatchObject({ balance: 90 });
    expect(lastUpdateOf(expenseRef(EXPENSE_ID))).toMatchObject({
      payerId: "user-a",
      linkedTransactionId: "movement-new",
    });
  });

  it("rejects taking over a movement owned by the friend", async () => {
    transactionGet.mockResolvedValueOnce(
      snapshot(
        EXPENSE_ID,
        storedLinkedExpense({
          payerId: "user-b",
          linkedTransactionId: "movement-b",
        }),
      ),
    );

    await expect(
      run({
        payerId: "user-a",
        walletId: WALLET_ID,
        categoryId: "category-shared",
      }),
    ).rejects.toMatchObject({ code: "LINKED_MOVEMENT_NOT_REVERTIBLE" });

    expect(transactionGet).toHaveBeenCalledTimes(1);
    expect(transactionSet).not.toHaveBeenCalled();
    expect(transactionUpdate).not.toHaveBeenCalled();
  });

  it("updates a movement whose wallet was permanently deleted without a balance write", async () => {
    transactionGet
      .mockResolvedValueOnce(
        snapshot(EXPENSE_ID, storedLinkedExpense({ walletId: "-1" })),
      )
      .mockResolvedValueOnce(
        snapshot("movement-1", movementDocument({ walletId: "-1" })),
      );

    await run({
      amountCents: 1200,
      walletId: "-1",
      categoryId: "category-shared",
    });

    expect(transactionGet).toHaveBeenCalledTimes(2);
    expect(lastUpdateOf(walletRef("-1"))).toBeUndefined();
    expect(lastUpdateOf(movementRef("movement-1"))).toMatchObject({
      amount: 12,
      walletId: "-1",
      deletedAt: null,
    });
  });

  it("revives a soft-deleted movement instead of creating another one", async () => {
    transactionGet
      .mockResolvedValueOnce(
        snapshot(
          EXPENSE_ID,
          storedLinkedExpense({ linkedTransactionId: "movement-1" }),
        ),
      )
      .mockResolvedValueOnce(
        snapshot(
          "movement-1",
          movementDocument({ deletedAt: "2026-11-14T10:00:00.000Z" }),
        ),
      )
      .mockResolvedValueOnce(
        snapshot(WALLET_ID, walletDocument({ balance: 100 })),
      );

    await run({ amountCents: 1200, walletId: WALLET_ID });

    expect(transactionSet).not.toHaveBeenCalled();
    expect(lastUpdateOf(movementRef("movement-1"))).toMatchObject({
      amount: 12,
      deletedAt: null,
      createdAt: "2026-11-10T20:00:00.000Z",
    });
    expect(lastUpdateOf(walletRef(WALLET_ID))).toMatchObject({ balance: 88 });
  });

  it("reverts the movement when the payer keeps paying and clears the wallet", async () => {
    transactionGet
      .mockResolvedValueOnce(snapshot(EXPENSE_ID, storedLinkedExpense()))
      .mockResolvedValueOnce(snapshot("movement-1", movementDocument()))
      .mockResolvedValueOnce(snapshot(WALLET_ID, walletDocument({ balance: 90 })));

    await run({ walletId: null, categoryId: null });

    expect(lastUpdateOf(walletRef(WALLET_ID))).toMatchObject({ balance: 100 });
    expect(lastUpdateOf(movementRef("movement-1"))).toMatchObject({
      deletedAt: NOW,
    });
    expect(lastUpdateOf(expenseRef(EXPENSE_ID))).toMatchObject({
      walletId: null,
      linkedTransactionId: null,
    });
  });
});
