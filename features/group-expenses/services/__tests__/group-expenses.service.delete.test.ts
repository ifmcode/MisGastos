import { describe, expect, it } from "@jest/globals";

import { FakeGroupsRepository } from "@/features/groups/services/__tests__/groups-service.fakes";

import { GroupExpensesService } from "../group-expenses.service";
import {
  FakeGroupExpensesRepository,
  FakeGroupExpenseLinkRepository,
  buildExpense,
  buildGroup,
} from "./group-expenses-service.fakes";
import { FakeGroupSettlementsRepository } from "./group-settlements-service.fakes";

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

describe("GroupExpensesService.deleteGroupExpense", () => {
  it("soft-deletes with one stamp for every allowed editor", async () => {
    const owner = createService();
    owner.repository.seed(
      buildExpense({ createdBy: "user-b", payerId: "user-b" }),
    );
    const creator = createService();
    creator.repository.seed(
      buildExpense({ createdBy: "user-b", payerId: "user-c" }),
    );
    const payer = createService();
    payer.repository.seed(
      buildExpense({ createdBy: "user-b", payerId: "user-c" }),
    );

    await owner.service.deleteGroupExpense("user-a", "expense-1");
    await creator.service.deleteGroupExpense("user-b", "expense-1");
    await payer.service.deleteGroupExpense("user-c", "expense-1");

    for (const harness of [owner, creator, payer]) {
      expect(harness.repository.deleteCalls).toEqual([
        { expenseId: "expense-1", deletedAt: expect.any(String) },
      ]);
      expect(harness.repository.expenses.get("expense-1")).toMatchObject({
        deletedAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    }
  });

  it("is idempotent for an already deleted expense", async () => {
    const { repository, service } = createService();
    repository.seed(
      buildExpense({ deletedAt: "2026-11-12T10:00:00.000Z" }),
    );

    await expect(
      service.deleteGroupExpense("user-a", "expense-1"),
    ).resolves.toBeUndefined();
    expect(repository.deleteCalls).toEqual([]);
  });

  it("still deletes an expense whose participant left the group", async () => {
    const { repository, service } = createService();
    repository.seed(
      buildExpense({
        participants: [
          { userId: "user-a", shareCents: 500 },
          { userId: "user-z", shareCents: 500 },
        ],
      }),
    );

    await expect(
      service.deleteGroupExpense("user-a", "expense-1"),
    ).resolves.toBeUndefined();
    expect(repository.deleteCalls).toHaveLength(1);
  });

  it("rejects another active member", async () => {
    const { repository, service } = createService();
    repository.seed(buildExpense({ createdBy: "user-b", payerId: "user-b" }));

    await expect(
      service.deleteGroupExpense("user-c", "expense-1"),
    ).rejects.toMatchObject({ code: "NOT_EXPENSE_EDITOR" });
    expect(repository.deleteCalls).toEqual([]);
  });

  it("rejects a viewer outside the group", async () => {
    const { repository, service } = createService();
    repository.seed(buildExpense());

    await expect(
      service.deleteGroupExpense("user-z", "expense-1"),
    ).rejects.toMatchObject({ code: "NOT_GROUP_MEMBER" });
    expect(repository.deleteCalls).toEqual([]);
  });

  it("rejects an unknown or blank expense id", async () => {
    const { service } = createService();

    await expect(
      service.deleteGroupExpense("user-a", "  "),
    ).rejects.toMatchObject({ code: "EXPENSE_NOT_FOUND" });
    await expect(
      service.deleteGroupExpense("user-a", "missing"),
    ).rejects.toMatchObject({ code: "EXPENSE_NOT_FOUND" });
  });

  it("fails with GROUP_NOT_FOUND when the group is gone", async () => {
    const { repository, service } = createService();
    repository.seed(buildExpense({ groupId: "user-x__deleted-group" }));

    await expect(
      service.deleteGroupExpense("user-a", "expense-1"),
    ).rejects.toMatchObject({ code: "GROUP_NOT_FOUND" });
  });

  it("requires a signed-in viewer", async () => {
    const { service } = createService();

    await expect(
      service.deleteGroupExpense("   ", "expense-1"),
    ).rejects.toMatchObject({ code: "SIGN_IN_REQUIRED" });
  });

  it("never deletes hard: the repository only receives a stamp", async () => {
    const { repository, service } = createService();
    repository.seed(buildExpense());

    await service.deleteGroupExpense("user-a", "expense-1");

    expect(repository.expenses.has("expense-1")).toBe(true);
    expect(repository.deleteCalls[0].deletedAt).toMatch(/T.*Z$/);
  });
});
