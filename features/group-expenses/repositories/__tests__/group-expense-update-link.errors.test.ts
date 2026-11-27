import { beforeEach, describe, expect, it } from "@jest/globals";

import {
  EXPENSE_ID,
  NOW,
  VIEWER,
  WALLET_ID,
  movementDocument,
  missingSnapshot,
  setupLinkOperationMocks,
  snapshot,
  transactionGet,
  transactionSet,
  transactionUpdate,
  walletDocument,
} from "./group-expense-link.test-helpers";
import { buildDocument } from "./group-expense-document.fixtures";
import type { UpdateGroupExpenseDto } from "../../types/group-expense.types";
import { updateGroupExpenseLinkOperation } from "../group-expense-link.operations";

beforeEach(setupLinkOperationMocks);

const baseUpdate: UpdateGroupExpenseDto = {
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
};

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

function run(update: Partial<typeof baseUpdate> = {}, viewerUid = VIEWER) {
  return updateGroupExpenseLinkOperation({
    viewerUid,
    expenseId: EXPENSE_ID,
    update: { ...baseUpdate, ...update },
  });
}

describe("updateGroupExpenseLinkOperation - failures", () => {
  it("rejects an unknown or malformed expense", async () => {
    transactionGet.mockResolvedValueOnce(missingSnapshot());

    await expect(run()).rejects.toMatchObject({ code: "EXPENSE_NOT_FOUND" });
    expect(transactionUpdate).not.toHaveBeenCalled();
  });

  it("rejects an already deleted expense", async () => {
    transactionGet.mockResolvedValueOnce(
      snapshot(
        EXPENSE_ID,
        storedLinkedExpense({ deletedAt: "2026-11-10T20:00:00.000Z" }),
      ),
    );

    await expect(run()).rejects.toMatchObject({ code: "ALREADY_DELETED" });
    expect(transactionUpdate).not.toHaveBeenCalled();
  });

  it("rejects an editor who is not the payer of a linked expense", async () => {
    transactionGet.mockResolvedValueOnce(
      snapshot(
        EXPENSE_ID,
        storedLinkedExpense({ payerId: "user-b" }),
      ),
    );

    await expect(run({}, VIEWER)).rejects.toMatchObject({
      code: "LINKED_MOVEMENT_FOREIGN",
    });
    expect(transactionUpdate).not.toHaveBeenCalled();
  });

  it("rejects a movement owned by another member", async () => {
    transactionGet
      .mockResolvedValueOnce(snapshot(EXPENSE_ID, storedLinkedExpense()))
      .mockResolvedValueOnce(
        snapshot("movement-1", movementDocument({ ownerId: "user-b" })),
      );

    await expect(run()).rejects.toMatchObject({ code: "WALLET_NOT_OWNED" });
    expect(transactionUpdate).not.toHaveBeenCalled();
  });

  it("rejects a wallet selected while another member pays", async () => {
    transactionGet.mockResolvedValueOnce(
      snapshot(
        EXPENSE_ID,
        storedLinkedExpense({ linkedTransactionId: null, walletId: null }),
      ),
    );

    await expect(
      run({ payerId: "user-b", walletId: WALLET_ID }),
    ).rejects.toMatchObject({ code: "WALLET_NOT_OWNED" });
    expect(transactionSet).not.toHaveBeenCalled();
  });

  it("rejects a missing, foreign or mismatched destination wallet", async () => {
    transactionGet
      .mockResolvedValueOnce(snapshot(EXPENSE_ID, storedLinkedExpense()))
      .mockResolvedValueOnce(snapshot("movement-1", movementDocument()))
      .mockResolvedValueOnce(missingSnapshot());
    await expect(run()).rejects.toMatchObject({ code: "WALLET_NOT_FOUND" });

    setupLinkOperationMocks();
    transactionGet
      .mockResolvedValueOnce(snapshot(EXPENSE_ID, storedLinkedExpense()))
      .mockResolvedValueOnce(snapshot("movement-1", movementDocument()))
      .mockResolvedValueOnce(
        snapshot(WALLET_ID, walletDocument({ ownerId: "user-b" })),
      );
    await expect(run()).rejects.toMatchObject({ code: "WALLET_NOT_OWNED" });

    setupLinkOperationMocks();
    transactionGet
      .mockResolvedValueOnce(snapshot(EXPENSE_ID, storedLinkedExpense()))
      .mockResolvedValueOnce(snapshot("movement-1", movementDocument()))
      .mockResolvedValueOnce(
        snapshot(WALLET_ID, walletDocument({ currency: "USD" })),
      );
    await expect(run()).rejects.toMatchObject({ code: "CURRENCY_MISMATCH" });
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

  it("updates a movement whose wallet was permanently deleted without a balance write", async () => {
    transactionGet
      .mockResolvedValueOnce(
        snapshot(EXPENSE_ID, storedLinkedExpense({ walletId: "-1" })),
      )
      .mockResolvedValueOnce(
        snapshot("movement-1", movementDocument({ walletId: "-1" })),
      );

    await run({ amountCents: 1200, walletId: "-1" });

    expect(transactionGet).toHaveBeenCalledTimes(2);
    expect(transactionUpdate).not.toHaveBeenCalledWith(
      { kind: "wallet", id: "-1" },
      expect.anything(),
    );
    expect(transactionUpdate).toHaveBeenCalledWith(
      { kind: "transaction", id: "movement-1" },
      expect.objectContaining({ amount: 12, deletedAt: null }),
    );
  });

  it("reverts a real wallet when the movement moves to a deleted one", async () => {
    transactionGet
      .mockResolvedValueOnce(snapshot(EXPENSE_ID, storedLinkedExpense()))
      .mockResolvedValueOnce(snapshot("movement-1", movementDocument()))
      .mockResolvedValueOnce(
        snapshot(WALLET_ID, walletDocument({ balance: 90 })),
      );

    await run({ amountCents: 1000, walletId: "-1" });

    expect(transactionUpdate).toHaveBeenCalledWith(
      { kind: "wallet", id: WALLET_ID },
      { balance: 100, updatedAt: NOW, revision: 1 },
    );
    expect(transactionUpdate).toHaveBeenCalledWith(
      { kind: "transaction", id: "movement-1" },
      expect.objectContaining({ walletId: "-1", amount: 10 }),
    );
  });
});
