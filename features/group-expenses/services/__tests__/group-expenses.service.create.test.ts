import { describe, expect, it } from "@jest/globals";

import { FakeGroupsRepository } from "@/features/groups/services/__tests__/groups-service.fakes";

import {
  GROUP_ID,
  buildInput,
  participantRows,
} from "../../schemas/__tests__/group-expense-input.test-helpers";
import { GroupExpenseValidationError } from "../group-expense.errors";
import { GroupExpensesService } from "../group-expenses.service";
import {
  FakeGroupExpensesRepository,
  buildGroup,
} from "./group-expenses-service.fakes";

function createService() {
  const repository = new FakeGroupExpensesRepository();
  const groupsRepository = new FakeGroupsRepository();
  groupsRepository.seedGroup(buildGroup());

  return {
    repository,
    groupsRepository,
    service: new GroupExpensesService(repository, groupsRepository),
  };
}

describe("GroupExpensesService.createGroupExpense", () => {
  it("persists the validated expense with its immutable envelope", async () => {
    const { repository, service } = createService();

    const expense = await service.createGroupExpense("user-a", buildInput());

    const dto = repository.createCalls[0];
    expect(dto).toEqual({
      groupId: GROUP_ID,
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
      createdBy: "user-a",
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      deletedAt: null,
    });
    expect(dto.createdAt).toBe(dto.updatedAt);
    expect(expense.id).toBe("expense-1");
  });

  it("lets the payer pay for others with a single participant", async () => {
    const { repository, service } = createService();

    await service.createGroupExpense(
      "user-b",
      buildInput({
        payerId: "user-b",
        participants: participantRows("user-c"),
      }),
    );

    expect(repository.createCalls[0]).toMatchObject({
      payerId: "user-b",
      createdBy: "user-b",
      participants: [{ userId: "user-c", shareCents: 1000 }],
    });
  });

  it("trims the viewer before it stamps createdBy", async () => {
    const { repository, service } = createService();

    await service.createGroupExpense(" user-a ", buildInput());

    expect(repository.createCalls[0].createdBy).toBe("user-a");
  });

  it("rejects a payer that is not an active group member", async () => {
    const { repository, service } = createService();

    await expect(
      service.createGroupExpense("user-a", buildInput({ payerId: "user-z" })),
    ).rejects.toMatchObject({
      fieldErrors: { payerId: "PAYER_NOT_MEMBER" },
    });
    expect(repository.createCalls).toEqual([]);
  });

  it("throws the validation error before touching the repository", async () => {
    const { repository, service } = createService();

    await expect(
      service.createGroupExpense("user-a", buildInput({ description: " " })),
    ).rejects.toBeInstanceOf(GroupExpenseValidationError);
    expect(repository.createCalls).toEqual([]);
  });
});
