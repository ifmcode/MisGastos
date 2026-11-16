import { describe, expect, it } from "@jest/globals";

import { FakeFriendsRepository } from "@/features/friends/services/__tests__/friends-service.fakes";

import { buildSharedExpense } from "../../utils/__tests__/shared-expense.fixtures";
import { SharedExpensesService } from "../shared-expenses.service";
import { FakeSharedExpensesRepository } from "./shared-expenses-service.fakes";

function createService() {
  const repository = new FakeSharedExpensesRepository();
  const service = new SharedExpensesService(
    repository,
    new FakeFriendsRepository(),
  );

  return { repository, service };
}

describe("SharedExpensesService.getExpenses", () => {
  it("returns every expense of the viewer sorted newest first", async () => {
    const { repository, service } = createService();
    repository.seed(buildSharedExpense({ id: "old", date: "2026-11-01" }));
    repository.seed(buildSharedExpense({ id: "new", date: "2026-11-12" }));
    repository.seed(
      buildSharedExpense({
        id: "deleted",
        date: "2026-11-05",
        deletedAt: "2026-11-06T10:00:00.000Z",
      }),
    );
    repository.seed(
      buildSharedExpense({
        id: "foreign",
        participantIds: ["user-b", "user-c"],
        pairId: "user-b__user-c",
      }),
    );

    const expenses = await service.getExpenses(" user-a ");

    expect(expenses.map((expense) => expense.id)).toEqual([
      "new",
      "deleted",
      "old",
    ]);
  });

  it("requires a signed-in viewer", async () => {
    const { repository, service } = createService();

    await expect(service.getExpenses("")).rejects.toMatchObject({
      code: "SIGN_IN_REQUIRED",
    });
    expect(repository.expenses.size).toBe(0);
  });
});

describe("SharedExpensesService.getExpense", () => {
  it("returns an expense the viewer participates in", async () => {
    const { repository, service } = createService();
    repository.seed(buildSharedExpense());

    await expect(service.getExpense("user-b", "expense-1")).resolves.toMatchObject(
      { id: "expense-1" },
    );
  });

  it("rejects an unknown expense", async () => {
    const { service } = createService();

    await expect(
      service.getExpense("user-a", "expense-404"),
    ).rejects.toMatchObject({ code: "EXPENSE_NOT_FOUND" });
  });

  it("rejects a viewer outside the pair", async () => {
    const { repository, service } = createService();
    repository.seed(buildSharedExpense());

    await expect(
      service.getExpense("user-c", "expense-1"),
    ).rejects.toMatchObject({ code: "NOT_PARTICIPANT" });
  });
});

describe("SharedExpensesService.deleteExpense", () => {
  it("soft-deletes an active expense", async () => {
    const { repository, service } = createService();
    repository.seed(buildSharedExpense());

    await service.deleteExpense("user-b", "expense-1");

    expect(repository.deleteCalls).toEqual([
      { expenseId: "expense-1", deletedAt: expect.any(String) },
    ]);
    expect(repository.expenses.get("expense-1")?.deletedAt).toEqual(
      expect.any(String),
    );
  });

  it("rejects an unknown expense", async () => {
    const { service } = createService();

    await expect(
      service.deleteExpense("user-a", "expense-404"),
    ).rejects.toMatchObject({ code: "EXPENSE_NOT_FOUND" });
  });

  it("rejects a viewer outside the pair", async () => {
    const { repository, service } = createService();
    repository.seed(buildSharedExpense());

    await expect(
      service.deleteExpense("user-c", "expense-1"),
    ).rejects.toMatchObject({ code: "NOT_PARTICIPANT" });
    expect(repository.deleteCalls).toEqual([]);
  });

  it("is idempotent on an already deleted expense", async () => {
    const { repository, service } = createService();
    repository.seed(
      buildSharedExpense({ deletedAt: "2026-11-14T10:00:00.000Z" }),
    );

    await expect(
      service.deleteExpense("user-a", "expense-1"),
    ).resolves.toBeUndefined();
    expect(repository.deleteCalls).toEqual([]);
  });
});
