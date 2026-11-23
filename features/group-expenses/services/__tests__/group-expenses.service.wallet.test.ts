import { describe, expect, it } from "@jest/globals";

import { FakeGroupsRepository } from "@/features/groups/services/__tests__/groups-service.fakes";

import { buildInput } from "../../schemas/__tests__/group-expense-input.test-helpers";
import { GroupExpensesService } from "../group-expenses.service";
import {
  FakeGroupExpensesRepository,
  FakeGroupExpenseLinkRepository,
  buildExpense,
  buildGroup,
} from "./group-expenses-service.fakes";
import { FakeGroupSettlementsRepository } from "./group-settlements-service.fakes";

const LINK = { walletId: "wallet-1", categoryId: "category-1" } as const;
const TOGGLE_OFF = {
  registerInWallet: false,
  walletId: "",
  categoryId: "",
} as const;

function createService() {
  const repository = new FakeGroupExpensesRepository();
  const linkRepository = new FakeGroupExpenseLinkRepository();
  const groupsRepository = new FakeGroupsRepository();
  groupsRepository.seedGroup(buildGroup());

  return {
    repository,
    linkRepository,
    service: new GroupExpensesService(
      repository,
      groupsRepository,
      linkRepository,
      new FakeGroupSettlementsRepository(),
    ),
  };
}

describe("GroupExpensesService payer wallet", () => {
  it("creates a social-only expense with the toggle off", async () => {
    const { repository, linkRepository, service } = createService();

    await service.createGroupExpense("user-a", buildInput(TOGGLE_OFF));

    expect(linkRepository.createCalls).toEqual([]);
    expect(repository.createCalls[0]).toMatchObject({
      payerId: "user-a",
      walletId: null,
      categoryId: null,
      linkedTransactionId: null,
    });
  });

  it("creates a linked expense through the atomic pair", async () => {
    const { repository, linkRepository, service } = createService();

    await service.createGroupExpense(
      "user-a",
      buildInput({ registerInWallet: true, ...LINK }),
    );

    expect(repository.createCalls).toEqual([]);
    expect(linkRepository.createCalls[0]).toMatchObject({
      payerId: "user-a",
      walletId: "wallet-1",
      categoryId: "category-1",
    });
  });

  it("never links a wallet when another member pays", async () => {
    const { repository, linkRepository, service } = createService();

    await service.createGroupExpense(
      "user-a",
      buildInput({ payerId: "user-b", registerInWallet: false, ...LINK }),
    );

    expect(linkRepository.createCalls).toEqual([]);
    expect(repository.createCalls[0]).toMatchObject({
      payerId: "user-b",
      walletId: null,
      categoryId: null,
    });
  });

  it("rejects registering without a wallet or a category", async () => {
    const { repository, linkRepository, service } = createService();

    await expect(
      service.createGroupExpense(
        "user-a",
        buildInput({ registerInWallet: true, walletId: "" }),
      ),
    ).rejects.toMatchObject({ fieldErrors: { walletId: "WALLET_REQUIRED" } });
    await expect(
      service.createGroupExpense(
        "user-a",
        buildInput({ registerInWallet: true, walletId: "wallet-1" }),
      ),
    ).rejects.toMatchObject({ fieldErrors: { categoryId: "CATEGORY_REQUIRED" } });

    expect(repository.createCalls).toEqual([]);
    expect(linkRepository.createCalls).toEqual([]);
  });

  it("keeps the link path on a currency change without a wallet", async () => {
    const { repository, linkRepository, service } = createService();
    const linked = buildExpense({
      walletId: "wallet-1",
      categoryId: "category-1",
      linkedTransactionId: "movement-1",
    });
    repository.seed(linked);
    linkRepository.seed(linked);

    await service.updateGroupExpense(
      "user-a",
      "expense-1",
      buildInput({ ...TOGGLE_OFF, currency: "USD" }),
    );

    expect(repository.updateCalls).toEqual([]);
    expect(linkRepository.updateCalls[0]?.update).toMatchObject({
      currency: "USD",
      walletId: null,
      categoryId: null,
    });
  });

  it("rejects a non-payer creator editing a linked expense", async () => {
    const { repository, linkRepository, service } = createService();
    const linked = buildExpense({
      createdBy: "user-a",
      payerId: "user-b",
      walletId: "wallet-1",
      categoryId: "category-1",
      linkedTransactionId: "movement-1",
    });
    repository.seed(linked);

    await expect(
      service.updateGroupExpense("user-a", "expense-1", buildInput()),
    ).rejects.toMatchObject({ code: "LINKED_MOVEMENT_FOREIGN" });

    expect(repository.updateCalls).toEqual([]);
    expect(linkRepository.updateCalls).toEqual([]);
  });

  it("rejects a non-payer creator deleting a linked expense", async () => {
    const { repository, linkRepository, service } = createService();
    repository.seed(
      buildExpense({
        createdBy: "user-a",
        payerId: "user-b",
        walletId: "wallet-1",
        categoryId: "category-1",
        linkedTransactionId: "movement-1",
      }),
    );

    await expect(
      service.deleteGroupExpense("user-a", "expense-1"),
    ).rejects.toMatchObject({ code: "LINKED_MOVEMENT_FOREIGN" });

    expect(repository.deleteCalls).toEqual([]);
    expect(linkRepository.deleteCalls).toEqual([]);
  });

  it("deletes a linked expense through the atomic pair for the payer", async () => {
    const { repository, linkRepository, service } = createService();
    repository.seed(
      buildExpense({
        payerId: "user-b",
        walletId: "wallet-1",
        categoryId: "category-1",
        linkedTransactionId: "movement-1",
      }),
    );

    await service.deleteGroupExpense("user-b", "expense-1");

    expect(repository.deleteCalls).toEqual([]);
    expect(linkRepository.deleteCalls[0]).toMatchObject({
      viewerUid: "user-b",
      expenseId: "expense-1",
    });
  });
});
