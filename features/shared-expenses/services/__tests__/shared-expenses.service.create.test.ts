import { describe, expect, it } from "@jest/globals";

import { FakeFriendsRepository } from "@/features/friends/services/__tests__/friends-service.fakes";

import { buildInput } from "../../schemas/__tests__/shared-expense-input.test-helpers";
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

describe("SharedExpensesService.createExpense", () => {
  it("persists the validated expense with its immutable envelope", async () => {
    const { repository, friendsRepository, service } = createService();
    friendsRepository.seedFriendship("user-a", "user-b");

    const expense = await service.createExpense("user-a", buildInput());

    const dto = repository.createCalls[0];
    expect(dto).toEqual({
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
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      deletedAt: null,
    });
    expect(dto.createdAt).toBe(dto.updatedAt);
    expect(expense.id).toBe("expense-1");
  });

  it("accepts the friend as the payer", async () => {
    const { repository, friendsRepository, service } = createService();
    friendsRepository.seedFriendship("user-a", "user-b");

    await service.createExpense(
      " user-a ",
      buildInput({ payerId: "user-b" }),
    );

    expect(repository.createCalls[0].payerId).toBe("user-b");
  });

  it("rejects sharing with someone who is not an accepted friend", async () => {
    const { repository, service } = createService();

    await expect(
      service.createExpense("user-a", buildInput()),
    ).rejects.toMatchObject({ code: "NOT_FRIEND" });
    expect(repository.createCalls).toEqual([]);
  });

  it("throws the validation error before touching the repository", async () => {
    const { repository, friendsRepository, service } = createService();
    friendsRepository.seedFriendship("user-a", "user-b");

    await expect(
      service.createExpense("user-a", buildInput({ description: " " })),
    ).rejects.toBeInstanceOf(SharedExpenseValidationError);
    expect(repository.createCalls).toEqual([]);
  });

  it("requires a signed-in viewer", async () => {
    const { repository, friendsRepository, service } = createService();

    await expect(
      service.createExpense("   ", buildInput()),
    ).rejects.toMatchObject({ code: "SIGN_IN_REQUIRED" });
    expect(friendsRepository.friendships.size).toBe(0);
    expect(repository.createCalls).toEqual([]);
  });
});

describe("SharedExpensesService.createExpense with a wallet", () => {
  it("creates the linked movement with the default category", async () => {
    const { repository, linkRepository, categoryRepository, friendsRepository, service } =
      createService();
    friendsRepository.seedFriendship("user-a", "user-b");

    const expense = await service.createExpense(
      "user-a",
      buildInput({ walletId: " wallet-1 " }),
    );

    expect(linkRepository.createCalls).toHaveLength(1);
    expect(repository.createCalls).toEqual([]);
    expect(linkRepository.createCalls[0]).toMatchObject({
      walletId: "wallet-1",
      categoryId: "user-a__shared-expense",
      linkedTransactionId: null,
    });
    expect(categoryRepository.ensureCalls).toEqual([
      expect.objectContaining({
        ownerId: "user-a",
        categoryId: "user-a__shared-expense",
      }),
    ]);
    expect(expense.id).toBe("expense-link-1");
  });

  it("ensures the deterministic category id preselected by the form", async () => {
    const { repository, linkRepository, categoryRepository, friendsRepository, service } =
      createService();
    friendsRepository.seedFriendship("user-a", "user-b");

    await service.createExpense(
      "user-a",
      buildInput({
        walletId: "wallet-1",
        categoryId: "user-a__shared-expense",
      }),
    );

    expect(linkRepository.createCalls[0].categoryId).toBe(
      "user-a__shared-expense",
    );
    expect(categoryRepository.ensureCalls).toEqual([
      expect.objectContaining({
        ownerId: "user-a",
        categoryId: "user-a__shared-expense",
      }),
    ]);
    expect(repository.createCalls).toEqual([]);
  });

  it("keeps a supplied category and does not ensure the default one", async () => {
    const { linkRepository, categoryRepository, friendsRepository, service } =
      createService();
    friendsRepository.seedFriendship("user-a", "user-b");

    await service.createExpense(
      "user-a",
      buildInput({ walletId: "wallet-1", categoryId: " category-2 " }),
    );

    expect(linkRepository.createCalls[0].categoryId).toBe("category-2");
    expect(categoryRepository.ensureCalls).toEqual([]);
  });

  it("drops the wallet when the friend is the payer", async () => {
    const { repository, linkRepository, categoryRepository, friendsRepository, service } =
      createService();
    friendsRepository.seedFriendship("user-a", "user-b");

    await service.createExpense(
      "user-a",
      buildInput({ walletId: "wallet-1", payerId: "user-b" }),
    );

    expect(linkRepository.createCalls).toEqual([]);
    expect(repository.createCalls[0]).toMatchObject({
      payerId: "user-b",
      walletId: null,
      categoryId: null,
      linkedTransactionId: null,
    });
    expect(categoryRepository.ensureCalls).toEqual([]);
  });

  it("exposes the deterministic category id", async () => {
    const { service } = createService();

    await expect(service.ensureSharedExpenseCategory("user-a")).resolves.toBe(
      "user-a__shared-expense",
    );
  });
});
