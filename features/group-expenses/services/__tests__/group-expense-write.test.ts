import { describe, expect, it } from "@jest/globals";

import type { ValidatedGroupExpense } from "../../types/group-expense.types";
import {
  buildCreateGroupExpenseDto,
  buildUpdateGroupExpenseDto,
  createGroupExpenseRecord,
  softDeleteGroupExpenseRecord,
  updateGroupExpenseRecord,
} from "../group-expense-write";
import {
  FakeGroupExpensesRepository,
  NOW,
  buildExpense,
} from "./group-expenses-service.fakes";

const VALUE: ValidatedGroupExpense = {
  groupId: "user-a__group-1",
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
};

describe("buildCreateGroupExpenseDto", () => {
  it("stamps the creator and the creation time", () => {
    expect(buildCreateGroupExpenseDto(VALUE, "user-a", NOW)).toEqual({
      ...VALUE,
      createdBy: "user-a",
      createdAt: NOW,
      updatedAt: NOW,
      deletedAt: null,
    });
  });
});

describe("buildUpdateGroupExpenseDto", () => {
  it("only carries the mutable fields", () => {
    expect(buildUpdateGroupExpenseDto(VALUE, NOW)).toEqual({
      payerId: "user-a",
      amountCents: 1000,
      currency: "EUR",
      splitMode: "equal",
      participants: VALUE.participants,
      description: "Dinner",
      date: "2026-11-10",
      updatedAt: NOW,
    });
  });
});

describe("group expense record writes", () => {
  it("creates the full document through the repository", async () => {
    const repository = new FakeGroupExpensesRepository();

    await createGroupExpenseRecord(repository, VALUE, "user-a", NOW);

    expect(repository.createCalls[0]).toMatchObject({
      createdBy: "user-a",
      createdAt: NOW,
      deletedAt: null,
    });
  });

  it("updates only the mutable slice", async () => {
    const repository = new FakeGroupExpensesRepository();
    repository.seed(buildExpense());

    await updateGroupExpenseRecord(repository, "expense-1", VALUE, NOW);

    expect(repository.updateCalls[0]).toEqual({
      expenseId: "expense-1",
      update: buildUpdateGroupExpenseDto(VALUE, NOW),
    });
  });

  it("soft-deletes with a single stamp", async () => {
    const repository = new FakeGroupExpensesRepository();

    await softDeleteGroupExpenseRecord(repository, "expense-1", NOW);

    expect(repository.deleteCalls).toEqual([
      { expenseId: "expense-1", deletedAt: NOW },
    ]);
  });
});
