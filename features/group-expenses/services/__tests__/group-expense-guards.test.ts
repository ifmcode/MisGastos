import { describe, expect, it } from "@jest/globals";

import { FakeGroupsRepository } from "@/features/groups/services/__tests__/groups-service.fakes";

import { buildInput } from "../../schemas/__tests__/group-expense-input.test-helpers";
import {
  assertExpenseEditor,
  assertExpenseHasCurrentMembers,
  assertExpenseNotDeleted,
  assertGroupExpenseMember,
  assertPayerIsMember,
  assertSameGroup,
  requireGroupExpense,
  requireGroupExpenseViewer,
  requireGroupForExpense,
  validateGroupExpenseOrThrow,
} from "../group-expense-guards";
import {
  FakeGroupExpensesRepository,
  buildExpense,
  buildGroup,
} from "./group-expenses-service.fakes";

describe("requireGroupExpenseViewer", () => {
  it("trims the viewer and rejects a blank or missing session", () => {
    expect(requireGroupExpenseViewer(" user-a ")).toBe("user-a");
    expect(() => requireGroupExpenseViewer("")).toThrow(
      expect.objectContaining({ code: "SIGN_IN_REQUIRED" }),
    );
    expect(() => requireGroupExpenseViewer(undefined)).toThrow(
      expect.objectContaining({ code: "SIGN_IN_REQUIRED" }),
    );
  });
});

describe("requireGroupForExpense", () => {
  it("returns the group and rejects a blank or unknown id", async () => {
    const groupsRepository = new FakeGroupsRepository();
    const group = groupsRepository.seedGroup(buildGroup());

    await expect(
      requireGroupForExpense(groupsRepository, ` ${group.id} `),
    ).resolves.toBe(group);
    await expect(
      requireGroupForExpense(groupsRepository, "  "),
    ).rejects.toMatchObject({ code: "GROUP_NOT_FOUND" });
    await expect(
      requireGroupForExpense(groupsRepository, "user-x__unknown"),
    ).rejects.toMatchObject({ code: "GROUP_NOT_FOUND" });
    await expect(
      requireGroupForExpense(groupsRepository, null as unknown as string),
    ).rejects.toMatchObject({ code: "GROUP_NOT_FOUND" });
  });
});

describe("membership and permission guards", () => {
  const group = buildGroup();

  it("accepts active members and rejects everyone else", () => {
    expect(() => assertGroupExpenseMember(group, "user-c")).not.toThrow();
    expect(() => assertGroupExpenseMember(group, "user-z")).toThrow(
      expect.objectContaining({ code: "NOT_GROUP_MEMBER" }),
    );
  });

  it("requires the payer to be an active member", () => {
    expect(() => assertPayerIsMember("user-b", group)).not.toThrow();
    expect(() => assertPayerIsMember("user-z", group)).toThrow(
      expect.objectContaining({ code: "PAYER_NOT_MEMBER" }),
    );
  });

  it("accepts the owner, the creator and the payer as editors", () => {
    const expense = buildExpense({ createdBy: "user-b", payerId: "user-c" });

    expect(() => assertExpenseEditor(expense, group, "user-a")).not.toThrow();
    expect(() => assertExpenseEditor(expense, group, "user-b")).not.toThrow();
    expect(() => assertExpenseEditor(expense, group, "user-c")).not.toThrow();
  });

  it("rejects an editor write on a soft-deleted expense", () => {
    const deleted = buildExpense({ deletedAt: "2026-11-12T10:00:00.000Z" });
    const active = buildExpense();

    expect(() => assertExpenseNotDeleted(active)).not.toThrow();
    expect(() => assertExpenseNotDeleted(deleted)).toThrow(
      expect.objectContaining({ code: "ALREADY_DELETED" }),
    );
  });

  it("rejects an edit whose stored participants are no longer members", () => {
    const active = buildExpense();
    const formerMember = buildExpense({
      participants: [
        { userId: "user-a", shareCents: 500 },
        { userId: "user-z", shareCents: 500 },
      ],
    });

    expect(() => assertExpenseHasCurrentMembers(active, group)).not.toThrow();
    expect(() => assertExpenseHasCurrentMembers(formerMember, group)).toThrow(
      expect.objectContaining({ code: "EXPENSE_HAS_FORMER_MEMBERS" }),
    );
  });

  it("keeps the expense in its group", () => {
    const expense = buildExpense();

    expect(() => assertSameGroup(` ${expense.groupId} `, expense)).not.toThrow();
    expect(() => assertSameGroup("user-a__group-2", expense)).toThrow(
      expect.objectContaining({ code: "GROUP_CHANGED" }),
    );
  });
});

describe("requireGroupExpense", () => {
  it("loads the trimmed expense and rejects a blank or unknown id", async () => {
    const repository = new FakeGroupExpensesRepository();
    const expense = repository.seed(buildExpense());

    await expect(
      requireGroupExpense(repository, " expense-1 "),
    ).resolves.toBe(expense);
    await expect(
      requireGroupExpense(repository, "   "),
    ).rejects.toMatchObject({ code: "EXPENSE_NOT_FOUND" });
    await expect(
      requireGroupExpense(repository, "missing"),
    ).rejects.toMatchObject({ code: "EXPENSE_NOT_FOUND" });
    await expect(
      requireGroupExpense(repository, null as unknown as string),
    ).rejects.toMatchObject({ code: "EXPENSE_NOT_FOUND" });
  });
});

describe("validateGroupExpenseOrThrow", () => {
  it("returns the normalized payload", () => {
    expect(validateGroupExpenseOrThrow(buildInput(), "user-a", buildGroup()))
      .toMatchObject({
        groupId: "user-a__group-1",
        amountCents: 1000,
      });
  });

  it("throws the validation error with per-field codes", () => {
    expect(() =>
      validateGroupExpenseOrThrow(buildInput({ amount: "" }), "user-a", buildGroup()),
    ).toThrow(
      expect.objectContaining({
        fieldErrors: { amount: "AMOUNT_REQUIRED" },
      }),
    );
  });
});
