import { describe, expect, it } from "@jest/globals";

import { FakeGroupsRepository } from "@/features/groups/services/__tests__/groups-service.fakes";

import { buildInput } from "../../schemas/__tests__/group-expense-input.test-helpers";
import { GroupExpenseValidationError } from "../group-expense.errors";
import { GroupExpensesService } from "../group-expenses.service";
import {
  FakeGroupExpensesRepository,
  buildExpense,
  buildGroup,
} from "./group-expenses-service.fakes";

function createService() {
  const repository = new FakeGroupExpensesRepository();
  const groupsRepository = new FakeGroupsRepository();
  groupsRepository.seedGroup(buildGroup());

  return {
    repository,
    service: new GroupExpensesService(repository, groupsRepository),
  };
}

describe("GroupExpensesService.updateGroupExpense", () => {
  it("lets the owner edit anyone's expense without moving its identity", async () => {
    const { repository, service } = createService();
    repository.seed(buildExpense({ createdBy: "user-b", payerId: "user-b" }));

    const expense = await service.updateGroupExpense(
      "user-a",
      "expense-1",
      buildInput({ amount: "12.00" }),
    );

    expect(repository.updateCalls[0]).toMatchObject({
      expenseId: "expense-1",
      update: {
        payerId: "user-a",
        amountCents: 1200,
        updatedAt: expect.any(String),
      },
    });
    expect(repository.updateCalls[0].update).not.toHaveProperty("groupId");
    expect(repository.updateCalls[0].update).not.toHaveProperty("createdBy");
    expect(repository.updateCalls[0].update).not.toHaveProperty("createdAt");
    expect(expense.createdAt).toBe("2026-11-20T10:00:00.000Z");
  });

  it("lets the creator and the payer edit their own expense", async () => {
    const creator = createService();
    creator.repository.seed(
      buildExpense({ createdBy: "user-b", payerId: "user-c" }),
    );
    const payer = createService();
    payer.repository.seed(
      buildExpense({ createdBy: "user-b", payerId: "user-c" }),
    );

    await creator.service.updateGroupExpense(
      "user-b",
      "expense-1",
      buildInput({ payerId: "user-c" }),
    );
    await payer.service.updateGroupExpense(
      "user-c",
      "expense-1",
      buildInput({ payerId: "user-c" }),
    );

    expect(creator.repository.updateCalls).toHaveLength(1);
    expect(payer.repository.updateCalls).toHaveLength(1);
  });

  it("rejects another active member as read-only", async () => {
    const { repository, service } = createService();
    repository.seed(buildExpense({ createdBy: "user-b", payerId: "user-b" }));

    await expect(
      service.updateGroupExpense("user-c", "expense-1", buildInput()),
    ).rejects.toMatchObject({ code: "NOT_EXPENSE_EDITOR" });
    expect(repository.updateCalls).toEqual([]);
  });

  it("rejects a viewer outside the group", async () => {
    const { repository, service } = createService();
    repository.seed(buildExpense());

    await expect(
      service.updateGroupExpense("user-z", "expense-1", buildInput()),
    ).rejects.toMatchObject({ code: "NOT_GROUP_MEMBER" });
  });

  it("rejects an unknown or blank expense id", async () => {
    const { service } = createService();

    await expect(
      service.updateGroupExpense("user-a", "missing", buildInput()),
    ).rejects.toMatchObject({ code: "EXPENSE_NOT_FOUND" });
  });

  it("rejects moving the expense to another group", async () => {
    const { repository, service } = createService();
    repository.seed(buildExpense());

    await expect(
      service.updateGroupExpense(
        "user-a",
        "expense-1",
        buildInput({ groupId: "user-a__group-2" }),
      ),
    ).rejects.toMatchObject({ code: "GROUP_CHANGED" });
    expect(repository.updateCalls).toEqual([]);
  });

  it("rejects editing an already deleted expense", async () => {
    const { repository, service } = createService();
    repository.seed(
      buildExpense({ deletedAt: "2026-11-12T10:00:00.000Z" }),
    );

    await expect(
      service.updateGroupExpense("user-a", "expense-1", buildInput()),
    ).rejects.toMatchObject({ code: "ALREADY_DELETED" });
    expect(repository.updateCalls).toEqual([]);
  });

  it("rejects editing an expense with a participant who left the group", async () => {
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
      service.updateGroupExpense("user-a", "expense-1", buildInput()),
    ).rejects.toMatchObject({ code: "EXPENSE_HAS_FORMER_MEMBERS" });
    expect(repository.updateCalls).toEqual([]);
  });

  it("rejects an invalid payload before writing", async () => {
    const { repository, service } = createService();
    repository.seed(buildExpense());

    await expect(
      service.updateGroupExpense("user-a", "expense-1", buildInput({ amount: "" })),
    ).rejects.toBeInstanceOf(GroupExpenseValidationError);
    expect(repository.updateCalls).toEqual([]);
  });

  it("rejects a payer outside the group before writing", async () => {
    const { repository, service } = createService();
    repository.seed(buildExpense());

    await expect(
      service.updateGroupExpense(
        "user-a",
        "expense-1",
        buildInput({ payerId: "user-z" }),
      ),
    ).rejects.toMatchObject({ fieldErrors: { payerId: "PAYER_NOT_MEMBER" } });
    expect(repository.updateCalls).toEqual([]);
  });

  it("requires a signed-in viewer", async () => {
    const { service } = createService();

    await expect(
      service.updateGroupExpense("", "expense-1", buildInput()),
    ).rejects.toMatchObject({ code: "SIGN_IN_REQUIRED" });
  });

  it("uses the id of the stored expense", async () => {
    const { repository, service } = createService();
    repository.seed(buildExpense({ id: "stored-id" }));

    await service.updateGroupExpense("user-a", " stored-id ", buildInput());

    expect(repository.updateCalls[0].expenseId).toBe("stored-id");
  });
});
