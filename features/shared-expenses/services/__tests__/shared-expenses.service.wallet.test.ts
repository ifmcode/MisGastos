import { describe, expect, it } from "@jest/globals";

import { FakeFriendsRepository } from "@/features/friends/services/__tests__/friends-service.fakes";

import { buildInput } from "../../schemas/__tests__/shared-expense-input.test-helpers";
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
  friendsRepository.seedFriendship("user-a", "user-b");

  return {
    repository,
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

describe("SharedExpensesService payer wallet", () => {
  it("rejects a viewer-paid expense without a wallet", async () => {
    const { repository, linkRepository, service } = createService();
    const pending = service.createExpense("user-a", buildInput({ walletId: "" }));

    await expect(pending).rejects.toBeInstanceOf(SharedExpenseValidationError);
    await expect(pending).rejects.toMatchObject({
      fieldErrors: { walletId: "WALLET_REQUIRED" },
    });
    expect(repository.createCalls).toEqual([]);
    expect(linkRepository.createCalls).toEqual([]);
  });

  it("creates a friend-paid expense as social-only", async () => {
    const { repository, linkRepository, service } = createService();

    await service.createExpense(
      "user-a",
      buildInput({ payerId: "user-b", walletId: "", categoryId: "" }),
    );

    expect(linkRepository.createCalls).toEqual([]);
    expect(repository.createCalls[0]).toMatchObject({
      payerId: "user-b",
      walletId: null,
      categoryId: null,
    });
  });

  it("rejects updating a legacy viewer-paid expense without a wallet", async () => {
    const { repository, linkRepository, service } = createService();
    repository.seed(buildSharedExpense({ walletId: null }));

    await expect(
      service.updateExpense("user-a", "expense-1", buildInput({ walletId: "" })),
    ).rejects.toMatchObject({
      fieldErrors: { walletId: "WALLET_REQUIRED" },
    });
    expect(repository.updateCalls).toEqual([]);
    expect(linkRepository.updateCalls).toEqual([]);
  });

  it("routes a friend-to-viewer takeover with a wallet through the link repository", async () => {
    const { repository, linkRepository, service } = createService();
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
      update: { payerId: "user-a", walletId: "wallet-1" },
    });
  });
});
