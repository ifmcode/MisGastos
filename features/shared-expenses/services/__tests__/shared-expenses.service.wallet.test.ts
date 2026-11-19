import { describe, expect, it } from "@jest/globals";

import { FakeFriendsRepository } from "@/features/friends/services/__tests__/friends-service.fakes";

import { buildInput } from "../../schemas/__tests__/shared-expense-input.test-helpers";
import { buildSharedExpense } from "../../utils/__tests__/shared-expense.fixtures";
import { SharedExpensesService } from "../shared-expenses.service";
import {
  FakeSharedExpenseCategoryRepository,
  FakeSharedExpenseLinkRepository,
  FakeSharedExpensesRepository,
} from "./shared-expenses-service.fakes";

/** Toggle off: no wallet, no category, no personal movement. */
const TOGGLE_OFF = {
  registerInWallet: false,
  walletId: "",
  categoryId: "",
} as const;

function createService() {
  const repository = new FakeSharedExpensesRepository();
  const friendsRepository = new FakeFriendsRepository();
  const linkRepository = new FakeSharedExpenseLinkRepository();
  friendsRepository.seedFriendship("user-a", "user-b");

  return {
    repository,
    linkRepository,
    service: new SharedExpensesService(
      repository,
      friendsRepository,
      linkRepository,
      new FakeSharedExpenseCategoryRepository(),
    ),
  };
}

describe("SharedExpensesService payer wallet", () => {
  it("rejects a viewer-paid expense without a wallet", async () => {
    const { repository, linkRepository, service } = createService();
    const pending = service.createExpense(
      "user-a",
      buildInput({ registerInWallet: true, walletId: "" }),
    );

    await expect(pending).rejects.toMatchObject({
      name: "SharedExpenseValidationError",
      fieldErrors: { walletId: "WALLET_REQUIRED" },
    });
    expect(repository.createCalls).toEqual([]);
    expect(linkRepository.createCalls).toEqual([]);
  });

  it("creates a viewer-paid expense without registration as social-only", async () => {
    const { repository, linkRepository, service } = createService();

    await service.createExpense("user-a", buildInput(TOGGLE_OFF));

    expect(linkRepository.createCalls).toEqual([]);
    expect(repository.createCalls[0]).toMatchObject({
      payerId: "user-a",
      walletId: null,
      categoryId: null,
      linkedTransactionId: null,
    });
  });

  it("rejects updating a legacy viewer-paid expense without a wallet", async () => {
    const { repository, linkRepository, service } = createService();
    repository.seed(buildSharedExpense({ walletId: null }));

    await expect(
      service.updateExpense(
        "user-a",
        "expense-1",
        buildInput({ registerInWallet: true, walletId: "" }),
      ),
    ).rejects.toMatchObject({
      fieldErrors: { walletId: "WALLET_REQUIRED" },
    });
    expect(repository.updateCalls).toEqual([]);
    expect(linkRepository.updateCalls).toEqual([]);
  });

  it("saves a legacy social edit without touching any wallet", async () => {
    const { repository, linkRepository, service } = createService();
    repository.seed(buildSharedExpense({ walletId: null }));

    await service.updateExpense("user-a", "expense-1", buildInput(TOGGLE_OFF));

    expect(linkRepository.updateCalls).toEqual([]);
    expect(repository.updateCalls[0]?.update).toMatchObject({
      walletId: null,
      categoryId: null,
    });
  });

  it("unlinks through the link repository when the toggle turns off", async () => {
    const { repository, linkRepository, service } = createService();
    const linked = buildSharedExpense({
      walletId: "wallet-1",
      categoryId: "category-1",
      linkedTransactionId: "movement-1",
    });
    repository.seed(linked);
    linkRepository.seed(linked);

    await service.updateExpense("user-a", "expense-1", buildInput(TOGGLE_OFF));

    expect(repository.updateCalls).toEqual([]);
    expect(linkRepository.updateCalls[0]).toMatchObject({
      viewerUid: "user-a",
      expenseId: "expense-1",
      update: { walletId: null, categoryId: null },
    });
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
