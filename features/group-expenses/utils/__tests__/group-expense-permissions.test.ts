import { describe, expect, it } from "@jest/globals";

import type { Group } from "@/features/groups/types/group.types";

import {
  canDeleteGroupExpense,
  canEditGroupExpense,
  hasFormerGroupExpenseMembers,
  hasGroupExpenseEditRights,
} from "../group-expense-permissions";
import { buildGroupExpense } from "./group-expense.fixtures";

function buildGroup(overrides: Partial<Group> = {}): Group {
  return {
    id: "user-a__group-1",
    ownerId: "user-a",
    memberIds: ["user-a", "user-b", "user-c", "user-d"],
    name: "Viaje",
    description: null,
    defaultCurrency: "EUR",
    joinCode: "ABCD2345",
    createdAt: "2026-11-01T10:00:00.000Z",
    updatedAt: "2026-11-01T10:00:00.000Z",
    ...overrides,
  };
}

describe("hasGroupExpenseEditRights", () => {
  const group = buildGroup();
  const expense = buildGroupExpense({ createdBy: "user-b", payerId: "user-c" });

  it("allows the group owner", () => {
    expect(hasGroupExpenseEditRights(expense, group, "user-a")).toBe(true);
  });

  it("allows the creator and the payer", () => {
    expect(hasGroupExpenseEditRights(expense, group, "user-b")).toBe(true);
    expect(hasGroupExpenseEditRights(expense, group, "user-c")).toBe(true);
  });

  it("rejects another member, a stranger and a blank viewer", () => {
    expect(hasGroupExpenseEditRights(expense, group, "user-d")).toBe(false);
    expect(hasGroupExpenseEditRights(expense, group, "user-z")).toBe(false);
    expect(hasGroupExpenseEditRights(expense, group, "   ")).toBe(false);
    expect(
      hasGroupExpenseEditRights(expense, group, null as unknown as string),
    ).toBe(false);
  });

  it("does not depend on the deletion state", () => {
    const deleted = {
      ...expense,
      deletedAt: "2026-11-11T10:00:00.000Z",
    };

    expect(hasGroupExpenseEditRights(deleted, group, "user-b")).toBe(true);
  });
});

describe("canDeleteGroupExpense", () => {
  it("requires an active expense the viewer may edit", () => {
    const group = buildGroup();
    const deleted = buildGroupExpense({
      createdBy: "user-b",
      deletedAt: "2026-11-11T10:00:00.000Z",
    });

    expect(canDeleteGroupExpense(deleted, group, "user-b")).toBe(false);
    expect(canDeleteGroupExpense(buildGroupExpense(), group, "user-a")).toBe(
      true,
    );
    expect(
      canDeleteGroupExpense(
        buildGroupExpense({ createdBy: "user-b", payerId: "user-c" }),
        group,
        "user-d",
      ),
    ).toBe(false);
  });
});

describe("hasFormerGroupExpenseMembers", () => {
  const group = buildGroup();

  it("is false while every participant and the payer are active members", () => {
    expect(hasFormerGroupExpenseMembers(buildGroupExpense(), group)).toBe(
      false,
    );
  });

  it("detects a participant who left the group", () => {
    const expense = buildGroupExpense({
      participants: [
        { userId: "user-a", shareCents: 500 },
        { userId: "user-z", shareCents: 500 },
      ],
    });

    expect(hasFormerGroupExpenseMembers(expense, group)).toBe(true);
  });

  it("detects a payer who left the group", () => {
    const expense = buildGroupExpense({ payerId: "user-z" });

    expect(hasFormerGroupExpenseMembers(expense, group)).toBe(true);
  });
});

describe("canEditGroupExpense", () => {
  it("requires an active expense", () => {
    const group = buildGroup();
    const deleted = buildGroupExpense({
      createdBy: "user-b",
      deletedAt: "2026-11-11T10:00:00.000Z",
    });

    expect(canEditGroupExpense(deleted, group, "user-b")).toBe(false);
    expect(canEditGroupExpense(buildGroupExpense(), group, "user-a")).toBe(
      true,
    );
  });

  it("rejects a member who is neither owner, creator nor payer", () => {
    const group = buildGroup();
    const expense = buildGroupExpense({
      createdBy: "user-b",
      payerId: "user-c",
    });

    expect(canEditGroupExpense(expense, group, "user-d")).toBe(false);
  });

  it("is read-only when a participant or the payer already left the group", () => {
    const group = buildGroup();
    const formerParticipant = buildGroupExpense({
      participants: [
        { userId: "user-a", shareCents: 500 },
        { userId: "user-z", shareCents: 500 },
      ],
    });
    const formerPayer = buildGroupExpense({ payerId: "user-z" });

    expect(canEditGroupExpense(formerParticipant, group, "user-a")).toBe(false);
    expect(canDeleteGroupExpense(formerParticipant, group, "user-a")).toBe(
      true,
    );
    expect(canEditGroupExpense(formerPayer, group, "user-a")).toBe(false);
    expect(canDeleteGroupExpense(formerPayer, group, "user-a")).toBe(true);
  });
});
