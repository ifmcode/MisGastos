import type { Group, GroupMember } from "@/features/groups/types/group.types";
import type { GroupExpense } from "../../types/group-expense.types";
import type { GroupExpenseFormValues } from "../group-expense-form";
import { createGroupExpenseFormValues } from "../group-expense-form";

export const VIEWER = "user-a";
export const GROUP_ID = "user-a__group-1";
export const TODAY = "2026-11-10";

export function buildMembers(): GroupMember[] {
  return [
    {
      uid: VIEWER,
      displayName: "Ana",
      email: "ana@example.com",
      role: "owner",
    },
    {
      uid: "user-b",
      displayName: "Beto",
      email: "beto@example.com",
      role: "member",
    },
    {
      uid: "user-c",
      displayName: null,
      email: "carla@example.com",
      role: "member",
    },
  ];
}

export function buildGroup(overrides: Partial<Group> = {}): Group {
  return {
    id: GROUP_ID,
    ownerId: VIEWER,
    memberIds: [VIEWER, "user-b", "user-c"],
    name: "Viaje",
    description: null,
    defaultCurrency: "EUR",
    joinCode: "ABCD2345",
    createdAt: "2026-11-01T10:00:00.000Z",
    updatedAt: "2026-11-01T10:00:00.000Z",
    ...overrides,
  };
}

export function buildFormValues(
  overrides: Partial<GroupExpenseFormValues> = {},
): GroupExpenseFormValues {
  return {
    ...createGroupExpenseFormValues({
      viewerUid: VIEWER,
      groupId: GROUP_ID,
      memberIds: [VIEWER, "user-b", "user-c"],
      currency: "EUR",
      date: TODAY,
    }),
    ...overrides,
  };
}

/** Active expense paid by `user-b` and split 50/50 with the viewer. */
export function buildExpense(
  overrides: Partial<GroupExpense> = {},
): GroupExpense {
  return {
    id: "expense-1",
    groupId: GROUP_ID,
    payerId: "user-b",
    amountCents: 1000,
    currency: "EUR",
    splitMode: "equal",
    participants: [
      { userId: VIEWER, shareCents: 500 },
      { userId: "user-b", shareCents: 500 },
    ],
    description: "Cena",
    date: "2026-11-08",
    createdBy: VIEWER,
    createdAt: "2026-11-08T20:00:00.000Z",
    updatedAt: "2026-11-08T20:00:00.000Z",
    deletedAt: null,
    ...overrides,
  };
}
