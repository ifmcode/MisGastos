import { describe, expect, it } from "@jest/globals";

import type { GroupSettlement } from "@/features/group-expenses/types/group-settlement.types";
import { buildGroupExpense } from "@/features/group-expenses/utils/__tests__/group-expense.fixtures";

import type {
  GroupActivity,
  GroupActivityType,
} from "../../types/group-activity.types";
import {
  buildGroupActivityEntries,
  getGroupActivityEntryDate,
} from "../group-activity-timeline";

const GROUP_ID = "user-a__group-1";
const CREATED_AT = "2026-11-10T20:00:00.000Z";

function buildActivity(
  type: GroupActivityType,
  overrides: Partial<GroupActivity> = {},
): GroupActivity {
  return {
    id: `activity-${type}`,
    type,
    groupId: GROUP_ID,
    actorId: "user-a",
    targetUserId: null,
    targetName: null,
    expenseId: null,
    settlementId: null,
    fromUserId: null,
    toUserId: null,
    amountCents: null,
    currency: null,
    description: null,
    changedFields: [],
    simplifyDebts: null,
    previousOwnerId: null,
    newOwnerId: null,
    createdAt: CREATED_AT,
    ...overrides,
  };
}

function buildSettlement(
  overrides: Partial<GroupSettlement> = {},
): GroupSettlement {
  return {
    id: "settlement-1",
    groupId: GROUP_ID,
    participantIds: ["user-a", "user-b"],
    pairId: "user-a__user-b",
    fromUserId: "user-b",
    toUserId: "user-a",
    amountCents: 500,
    currency: "EUR",
    date: "2026-11-10",
    note: "",
    createdBy: "user-b",
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
    deletedAt: null,
    receiverWalletId: null,
    receiverCategoryId: null,
    receiverTransactionId: null,
    ...overrides,
  };
}

describe("buildGroupActivityEntries", () => {
  it("returns an empty register without records or events", () => {
    expect(
      buildGroupActivityEntries({
        expenses: [],
        settlements: [],
        activities: [],
      }),
    ).toEqual([]);
  });

  it("renders each active expense and settlement once", () => {
    const expense = buildGroupExpense({
      id: "expense-1",
      createdAt: "2026-11-10T10:00:00.000Z",
    });
    const settlement = buildSettlement({
      id: "settlement-1",
      createdAt: "2026-11-11T10:00:00.000Z",
    });

    const entries = buildGroupActivityEntries({
      expenses: [expense],
      settlements: [settlement],
      activities: [],
    });

    expect(entries.map((entry) => [entry.kind, entry.key])).toEqual([
      ["settlement", "settlement:settlement-1"],
      ["expense", "expense:expense-1"],
    ]);
    expect(entries[0].sortAt).toBe("2026-11-11T10:00:00.000Z");
    expect(entries[1].sortAt).toBe("2026-11-10T10:00:00.000Z");
  });

  it("skips the creation event of an active record", () => {
    const expense = buildGroupExpense({ id: "expense-1" });
    const settlement = buildSettlement({ id: "settlement-1" });

    const entries = buildGroupActivityEntries({
      expenses: [expense],
      settlements: [settlement],
      activities: [
        buildActivity("expense-created", {
          id: "created-expense",
          expenseId: "expense-1",
        }),
        buildActivity("settlement-created", {
          id: "created-settlement",
          settlementId: "settlement-1",
        }),
      ],
    });

    expect(entries.map((entry) => entry.key)).toEqual([
      "expense:expense-1",
      "settlement:settlement-1",
    ]);
  });

  it("represents a deleted record only through its deletion event", () => {
    const deletedExpense = buildGroupExpense({
      id: "expense-deleted",
      deletedAt: "2026-11-12T10:00:00.000Z",
    });
    const deletedSettlement = buildSettlement({
      id: "settlement-deleted",
      deletedAt: "2026-11-13T10:00:00.000Z",
    });

    const entries = buildGroupActivityEntries({
      expenses: [deletedExpense],
      settlements: [deletedSettlement],
      activities: [
        buildActivity("expense-created", {
          id: "created-expense",
          expenseId: "expense-deleted",
        }),
        buildActivity("expense-deleted", {
          id: "removed-expense",
          expenseId: "expense-deleted",
          createdAt: "2026-11-12T10:00:00.000Z",
        }),
        buildActivity("settlement-created", {
          id: "created-settlement",
          settlementId: "settlement-deleted",
        }),
        buildActivity("settlement-deleted", {
          id: "removed-settlement",
          settlementId: "settlement-deleted",
          createdAt: "2026-11-13T10:00:00.000Z",
        }),
      ],
    });

    expect(entries.map((entry) => [entry.kind, entry.key])).toEqual([
      ["event", "activity:removed-settlement"],
      ["event", "activity:removed-expense"],
    ]);
  });

  it("keeps edits, memberships, transfers and settings entries", () => {
    const kept: readonly GroupActivityType[] = [
      "expense-updated",
      "expense-deleted",
      "settlement-updated",
      "settlement-deleted",
      "member-joined",
      "member-left",
      "member-removed",
      "owner-transferred",
      "group-updated",
      "simplify-debts-changed",
    ];

    const entries = buildGroupActivityEntries({
      expenses: [],
      settlements: [],
      activities: kept.map((type, index) =>
        buildActivity(type, {
          id: `event-${index}`,
          createdAt: `2026-11-${String(10 + index).padStart(2, "0")}T10:00:00.000Z`,
        }),
      ),
    });

    expect(entries).toHaveLength(kept.length);
    expect(entries.every((entry) => entry.kind === "event")).toBe(true);
    expect(entries.map((entry) => entry.key)).toEqual([
      "activity:event-9",
      "activity:event-8",
      "activity:event-7",
      "activity:event-6",
      "activity:event-5",
      "activity:event-4",
      "activity:event-3",
      "activity:event-2",
      "activity:event-1",
      "activity:event-0",
    ]);
  });

  it("keeps a legacy record without any stored event", () => {
    const legacy = buildGroupExpense({
      id: "legacy-expense",
      createdAt: "2025-01-05T09:00:00.000Z",
    });

    const entries = buildGroupActivityEntries({
      expenses: [legacy],
      settlements: [],
      activities: [],
    });

    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      kind: "expense",
      key: "expense:legacy-expense",
      sortAt: "2025-01-05T09:00:00.000Z",
    });
  });

  it("orders by activity time newest first and breaks ties by key", () => {
    const expense = buildGroupExpense({
      id: "expense-1",
      createdAt: "2026-11-10T10:00:00.000Z",
    });
    const entries = buildGroupActivityEntries({
      expenses: [expense],
      settlements: [],
      activities: [
        buildActivity("group-updated", {
          id: "same-time",
          createdAt: "2026-11-10T10:00:00.000Z",
        }),
        buildActivity("member-left", {
          id: "older",
          createdAt: "2026-11-09T10:00:00.000Z",
        }),
      ],
    });

    expect(entries.map((entry) => entry.key)).toEqual([
      "activity:same-time",
      "expense:expense-1",
      "activity:older",
    ]);
  });

  it("orders two events with the same timestamp by key ascending", () => {
    const entries = buildGroupActivityEntries({
      expenses: [],
      settlements: [],
      activities: [
        buildActivity("member-left", { id: "b" }),
        buildActivity("group-updated", { id: "a" }),
      ],
    });

    expect(entries.map((entry) => entry.key)).toEqual([
      "activity:a",
      "activity:b",
    ]);
  });
});

describe("getGroupActivityEntryDate", () => {
  it("turns an activity timestamp into the local calendar day", () => {
    const local = new Date(2026, 10, 20, 12, 0, 0);

    expect(getGroupActivityEntryDate(local.toISOString())).toBe("2026-11-20");
  });

  it("keeps a date-only value as it is", () => {
    expect(getGroupActivityEntryDate("2026-11-20")).toBe("2026-11-20");
  });

  it("keeps an unparseable value untouched", () => {
    expect(getGroupActivityEntryDate("sin-fecha")).toBe("sin-fecha");
  });
});
