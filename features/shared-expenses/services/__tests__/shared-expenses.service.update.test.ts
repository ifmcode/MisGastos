import { describe, expect, it } from "@jest/globals";

import { FakeFriendsRepository } from "@/features/friends/services/__tests__/friends-service.fakes";

import {
  buildInput,
  participantRows,
} from "../../schemas/__tests__/shared-expense-input.test-helpers";
import { buildSharedExpense } from "../../utils/__tests__/shared-expense.fixtures";
import { SharedExpenseValidationError } from "../shared-expense.errors";
import { SharedExpensesService } from "../shared-expenses.service";
import {
  FakeSharedExpenseCategoryRepository,
  FakeSharedExpenseLinkRepository,
  FakeSharedExpensesRepository,
} from "./shared-expenses-service.fakes";

function createService() {
  const repository = new FakeSharedExpensesRepository();
  const friendsRepository = new FakeFriendsRepository();
  const linkRepository = new FakeSharedExpenseLinkRepository();
  const categoryRepository = new FakeSharedExpenseCategoryRepository();

  return {
    repository,
    friendsRepository,
    linkRepository,
    categoryRepository,
    service: new SharedExpensesService(
      repository,
      friendsRepository,
      linkRepository,
      categoryRepository,
    ),
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
      walletId: null,
      categoryId: null,
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

describe("SharedExpensesService.updateExpense link routing", () => {
  it("routes to the link repository when a wallet is added", async () => {
    const { repository, linkRepository, categoryRepository, friendsRepository, service } =
      createService();
    friendsRepository.seedFriendship("user-a", "user-b");
    repository.seed(buildSharedExpense());
    linkRepository.seed(buildSharedExpense());

    await service.updateExpense(
      "user-a",
      "expense-1",
      buildInput({ walletId: "wallet-1" }),
    );

    expect(repository.updateCalls).toEqual([]);
    expect(linkRepository.updateCalls[0]).toMatchObject({
      viewerUid: "user-a",
      expenseId: "expense-1",
      update: {
        walletId: "wallet-1",
        categoryId: "user-a__shared-expense",
      },
    });
    expect(categoryRepository.ensureCalls).toHaveLength(1);
  });

  it("keeps the social path while no wallet is involved", async () => {
    const { repository, linkRepository, friendsRepository, service } =
      createService();
    friendsRepository.seedFriendship("user-a", "user-b");
    repository.seed(buildSharedExpense());

    await service.updateExpense("user-a", "expense-1", buildInput());

    expect(linkRepository.updateCalls).toEqual([]);
    expect(repository.updateCalls[0].update).toMatchObject({
      walletId: null,
      categoryId: null,
    });
  });

  it("rejects editing a linked expense owned by the friend", async () => {
    const { repository, linkRepository, friendsRepository, service } =
      createService();
    friendsRepository.seedFriendship("user-a", "user-b");
    repository.seed(
      buildSharedExpense({
        payerId: "user-b",
        walletId: "wallet-b",
        categoryId: "category-1",
        linkedTransactionId: "movement-b",
      }),
    );

    await expect(
      service.updateExpense(
        "user-a",
        "expense-1",
        buildInput({ payerId: "user-b", description: "Lunch" }),
      ),
    ).rejects.toMatchObject({ code: "LINKED_MOVEMENT_FOREIGN" });

    expect(repository.updateCalls).toEqual([]);
    expect(linkRepository.updateCalls).toEqual([]);
  });

  it("creates the viewer's own movement when taking over a social expense", async () => {
    const { repository, linkRepository, categoryRepository, friendsRepository, service } =
      createService();
    friendsRepository.seedFriendship("user-a", "user-b");
    const friendPaid = buildSharedExpense({ payerId: "user-b" });
    repository.seed(friendPaid);
    linkRepository.seed(friendPaid);

    await service.updateExpense(
      "user-a",
      "expense-1",
      buildInput({ payerId: "user-a", walletId: "wallet-1" }),
    );

    expect(repository.updateCalls).toEqual([]);
    expect(linkRepository.updateCalls[0]).toMatchObject({
      viewerUid: "user-a",
      update: {
        payerId: "user-a",
        walletId: "wallet-1",
        categoryId: "user-a__shared-expense",
      },
    });
    expect(categoryRepository.ensureCalls).toHaveLength(1);
  });

  it("keeps the link path when a linked expense clears its wallet", async () => {
    const { repository, linkRepository, friendsRepository, service } =
      createService();
    friendsRepository.seedFriendship("user-a", "user-b");
    const linked = buildSharedExpense({
      walletId: "wallet-1",
      categoryId: "category-1",
      linkedTransactionId: "movement-1",
    });
    repository.seed(linked);
    linkRepository.seed(linked);

    await service.updateExpense("user-a", "expense-1", buildInput());

    expect(repository.updateCalls).toEqual([]);
    expect(linkRepository.updateCalls[0].update).toMatchObject({
      walletId: null,
      categoryId: null,
    });
  });
});
