import { describe, expect, it, jest } from "@jest/globals";

import { FakeGroupsRepository } from "@/features/groups/services/__tests__/groups-service.fakes";

import { GroupExpensesService } from "../group-expenses.service";
import {
  FakeGroupExpensesRepository,
  FakeGroupExpenseLinkRepository,
  GROUP_ID,
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
    groupsRepository,
    service: new GroupExpensesService(
      repository,
      groupsRepository,
      linkRepository,
      new FakeGroupSettlementsRepository(),
    ),
  };
}

describe("GroupExpensesService.getGroupExpenses", () => {
  it("returns the group expenses newest first, soft-deleted included", async () => {
    const { repository, service } = createService();
    repository.seed(buildExpense({ id: "older", date: "2026-11-09" }));
    repository.seed(buildExpense({ id: "newer", date: "2026-11-11" }));
    repository.seed(
      buildExpense({
        id: "deleted",
        date: "2026-11-10",
        deletedAt: "2026-11-12T10:00:00.000Z",
      }),
    );

    const expenses = await service.getGroupExpenses("user-b", GROUP_ID);

    expect(expenses.map((expense) => expense.id)).toEqual([
      "newer",
      "deleted",
      "older",
    ]);
  });

  it("never returns expenses of another group", async () => {
    const { repository, service } = createService();
    repository.seed(buildExpense());
    repository.seed(buildExpense({ id: "other", groupId: "user-a__group-2" }));

    const expenses = await service.getGroupExpenses("user-a", GROUP_ID);

    expect(expenses.map((expense) => expense.id)).toEqual(["expense-1"]);
  });

  it("requires the viewer to be an active member", async () => {
    const { repository, service } = createService();
    const spy = jest.spyOn(repository, "getGroupExpenses");

    await expect(
      service.getGroupExpenses("user-z", GROUP_ID),
    ).rejects.toMatchObject({ code: "NOT_GROUP_MEMBER" });
    expect(spy).not.toHaveBeenCalled();
  });

  it("fails with GROUP_NOT_FOUND for an unknown group", async () => {
    const { service } = createService();

    await expect(
      service.getGroupExpenses("user-a", "user-x__unknown"),
    ).rejects.toMatchObject({ code: "GROUP_NOT_FOUND" });
  });

  it("requires a signed-in viewer", async () => {
    const { service } = createService();

    await expect(service.getGroupExpenses("  ", GROUP_ID)).rejects.toMatchObject(
      { code: "SIGN_IN_REQUIRED" },
    );
  });
});

describe("GroupExpensesService.getGroupExpense", () => {
  it("returns one expense to an active member", async () => {
    const { repository, service } = createService();
    repository.seed(buildExpense());

    await expect(
      service.getGroupExpense("user-c", "expense-1"),
    ).resolves.toMatchObject({ id: "expense-1", groupId: GROUP_ID });
  });

  it("keeps a soft-deleted expense readable for the audit trail", async () => {
    const { repository, service } = createService();
    repository.seed(
      buildExpense({ deletedAt: "2026-11-12T10:00:00.000Z" }),
    );

    await expect(
      service.getGroupExpense("user-a", "expense-1"),
    ).resolves.toMatchObject({ deletedAt: "2026-11-12T10:00:00.000Z" });
  });

  it("fails with EXPENSE_NOT_FOUND for a blank or unknown id", async () => {
    const { service } = createService();

    await expect(service.getGroupExpense("user-a", "   ")).rejects.toMatchObject(
      { code: "EXPENSE_NOT_FOUND" },
    );
    await expect(
      service.getGroupExpense("user-a", "missing"),
    ).rejects.toMatchObject({ code: "EXPENSE_NOT_FOUND" });
  });

  it("rejects a viewer that does not belong to the expense group", async () => {
    const { repository, service } = createService();
    repository.seed(buildExpense());

    await expect(
      service.getGroupExpense("user-z", "expense-1"),
    ).rejects.toMatchObject({ code: "NOT_GROUP_MEMBER" });
  });
});
