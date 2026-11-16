import { describe, expect, it } from "@jest/globals";

import { FakeFriendsRepository } from "@/features/friends/services/__tests__/friends-service.fakes";

import {
  buildInput,
  participantRows,
} from "../../schemas/__tests__/shared-expense-input.test-helpers";
import { buildSharedExpense } from "../../utils/__tests__/shared-expense.fixtures";
import { SharedExpenseValidationError } from "../shared-expense.errors";
import { SharedExpensesService } from "../shared-expenses.service";
import { FakeSharedExpensesRepository } from "./shared-expenses-service.fakes";

function createService() {
  const repository = new FakeSharedExpensesRepository();
  const friendsRepository = new FakeFriendsRepository();

  return {
    repository,
    friendsRepository,
    service: new SharedExpensesService(repository, friendsRepository),
  };
}

describe("SharedExpensesService.updateExpense", () => {
  it("rewrites only the mutable fields of the stored pair", async () => {
    const { repository, friendsRepository, service } = createService();
    friendsRepository.seedFriendship("user-a", "user-b");
    repository.seed(buildSharedExpense());

    const expense = await service.updateExpense(
      "user-a",
      " expense-1 ",
      buildInput({ amount: "20.00", description: " Lunch " }),
    );

    const call = repository.updateCalls[0];
    expect(call.expenseId).toBe("expense-1");
    expect(call.update).toEqual({
      payerId: "user-a",
      amountCents: 2000,
      currency: "EUR",
      splitMode: "equal",
      participants: [
        { userId: "user-a", shareCents: 1000 },
        { userId: "user-b", shareCents: 1000 },
      ],
      description: "Lunch",
      date: "2026-11-10",
      updatedAt: expect.any(String),
    });
    expect(expense.createdAt).toBe("2026-11-10T20:00:00.000Z");
    expect(expense.participantIds).toEqual(["user-a", "user-b"]);
  });

  it("rejects an unknown expense", async () => {
    const { service } = createService();

    await expect(
      service.updateExpense("user-a", "expense-404", buildInput()),
    ).rejects.toMatchObject({ code: "EXPENSE_NOT_FOUND" });
  });

  it("rejects a viewer outside the pair", async () => {
    const { repository, service } = createService();
    repository.seed(
      buildSharedExpense({
        id: "expense-1",
        participantIds: ["user-b", "user-c"],
        pairId: "user-b__user-c",
      }),
    );

    await expect(
      service.updateExpense("user-a", "expense-1", buildInput()),
    ).rejects.toMatchObject({ code: "NOT_PARTICIPANT" });
  });

  it("rejects edits of a soft-deleted expense", async () => {
    const { repository, friendsRepository, service } = createService();
    friendsRepository.seedFriendship("user-a", "user-b");
    repository.seed(
      buildSharedExpense({ deletedAt: "2026-11-14T10:00:00.000Z" }),
    );

    await expect(
      service.updateExpense("user-a", "expense-1", buildInput()),
    ).rejects.toMatchObject({ code: "ALREADY_DELETED" });
    expect(repository.updateCalls).toEqual([]);
  });

  it("rejects retargeting the expense to another friend", async () => {
    const { repository, friendsRepository, service } = createService();
    friendsRepository.seedFriendship("user-a", "user-b");
    friendsRepository.seedFriendship("user-a", "user-c");
    repository.seed(buildSharedExpense());

    await expect(
      service.updateExpense(
        "user-a",
        "expense-1",
        buildInput({
          friendUid: "user-c",
          participants: participantRows("user-a", "user-c"),
        }),
      ),
    ).rejects.toMatchObject({ code: "NOT_PARTICIPANT" });
    expect(repository.updateCalls).toEqual([]);
  });

  it("re-checks the friendship of the stored pair", async () => {
    const { repository, service } = createService();
    repository.seed(buildSharedExpense());

    await expect(
      service.updateExpense("user-a", "expense-1", buildInput()),
    ).rejects.toMatchObject({ code: "NOT_FRIEND" });
    expect(repository.updateCalls).toEqual([]);
  });

  it("throws the validation error for an invalid payload", async () => {
    const { repository, friendsRepository, service } = createService();
    friendsRepository.seedFriendship("user-a", "user-b");
    repository.seed(buildSharedExpense());

    await expect(
      service.updateExpense(
        "user-a",
        "expense-1",
        buildInput({ amount: "0" }),
      ),
    ).rejects.toBeInstanceOf(SharedExpenseValidationError);
    expect(repository.updateCalls).toEqual([]);
  });
});
