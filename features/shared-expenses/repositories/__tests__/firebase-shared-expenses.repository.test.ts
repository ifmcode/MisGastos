import { describe, expect, it, jest } from "@jest/globals";

jest.mock("../shared-expenses.operations", () => ({
  SHARED_EXPENSES_COLLECTION: "sharedExpenses",
  createSharedExpenseOperation: jest.fn(async () => "created"),
  getSharedExpenseOperation: jest.fn(async () => "read"),
  getSharedExpensesOperation: jest.fn(async () => ["listed"]),
  softDeleteSharedExpenseOperation: jest.fn(async () => undefined),
  updateSharedExpenseOperation: jest.fn(async () => "updated"),
}));

jest.mock("../shared-expense-link.operations", () => ({
  createSharedExpenseLinkOperation: jest.fn(async () => "linked"),
  softDeleteSharedExpenseLinkOperation: jest.fn(async () => undefined),
  updateSharedExpenseLinkOperation: jest.fn(async () => "linked-updated"),
}));

import type {
  CreateSharedExpenseDto,
  UpdateSharedExpenseDto,
} from "../../types/shared-expense.types";
import { FirebaseSharedExpensesRepository } from "../firebase-shared-expenses.repository";
import {
  createSharedExpenseLinkOperation,
  softDeleteSharedExpenseLinkOperation,
  updateSharedExpenseLinkOperation,
} from "../shared-expense-link.operations";
import {
  createSharedExpenseOperation,
  getSharedExpenseOperation,
  getSharedExpensesOperation,
  softDeleteSharedExpenseOperation,
  updateSharedExpenseOperation,
} from "../shared-expenses.operations";

const createDto: CreateSharedExpenseDto = {
  participantIds: ["user-a", "user-b"],
  pairId: "user-a__user-b",
  payerId: "user-a",
  amountCents: 1000,
  currency: "EUR",
  splitMode: "equal",
  participants: [
    { userId: "user-a", shareCents: 500 },
    { userId: "user-b", shareCents: 500 },
  ],
  description: "Dinner",
  date: "2026-11-10",
  walletId: null,
  categoryId: null,
  linkedTransactionId: null,
  createdBy: "user-a",
  createdAt: "2026-11-10T20:00:00.000Z",
  updatedAt: "2026-11-10T20:00:00.000Z",
  deletedAt: null,
};

const updateDto: UpdateSharedExpenseDto = {
  payerId: "user-b",
  amountCents: 2000,
  currency: "EUR",
  splitMode: "equal",
  participants: [
    { userId: "user-a", shareCents: 1000 },
    { userId: "user-b", shareCents: 1000 },
  ],
  description: "Dinner",
  date: "2026-11-10",
  walletId: null,
  categoryId: null,
  updatedAt: "2026-11-11T10:00:00.000Z",
};

describe("FirebaseSharedExpensesRepository", () => {
  it("delegates every social-only method to its operation", async () => {
    const repository = new FirebaseSharedExpensesRepository();

    await expect(repository.getExpense("expense-1")).resolves.toBe("read");
    await expect(repository.getExpenses("user-a")).resolves.toEqual(["listed"]);
    await expect(repository.createExpense(createDto)).resolves.toBe("created");
    await expect(
      repository.updateExpense("expense-1", updateDto),
    ).resolves.toBe("updated");
    await expect(
      repository.softDeleteExpense("expense-1", "2026-11-15T10:00:00.000Z"),
    ).resolves.toBeUndefined();

    expect(getSharedExpenseOperation).toHaveBeenCalledWith("expense-1");
    expect(getSharedExpensesOperation).toHaveBeenCalledWith("user-a");
    expect(createSharedExpenseOperation).toHaveBeenCalledWith(createDto);
    expect(updateSharedExpenseOperation).toHaveBeenCalledWith(
      "expense-1",
      updateDto,
    );
    expect(softDeleteSharedExpenseOperation).toHaveBeenCalledWith(
      "expense-1",
      "2026-11-15T10:00:00.000Z",
    );
  });

  it("delegates the linked pair to the link operations", async () => {
    const repository = new FirebaseSharedExpensesRepository();

    await expect(repository.createExpenseLink(createDto)).resolves.toBe(
      "linked",
    );
    await expect(
      repository.updateExpenseLink("user-a", "expense-1", updateDto),
    ).resolves.toBe("linked-updated");
    await expect(
      repository.softDeleteExpenseLink(
        "user-a",
        "expense-1",
        "2026-11-15T10:00:00.000Z",
      ),
    ).resolves.toBeUndefined();

    expect(createSharedExpenseLinkOperation).toHaveBeenCalledWith(createDto);
    expect(updateSharedExpenseLinkOperation).toHaveBeenCalledWith({
      viewerUid: "user-a",
      expenseId: "expense-1",
      update: updateDto,
    });
    expect(softDeleteSharedExpenseLinkOperation).toHaveBeenCalledWith({
      viewerUid: "user-a",
      expenseId: "expense-1",
      deletedAt: "2026-11-15T10:00:00.000Z",
    });
  });
});
