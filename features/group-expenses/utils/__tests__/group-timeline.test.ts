import { describe, expect, it } from "@jest/globals";

import type { GroupSettlement } from "../../types/group-settlement.types";
import { buildGroupTimeline } from "../group-timeline";
import { buildGroupExpense } from "./group-expense.fixtures";

function buildSettlement(
  overrides: Partial<GroupSettlement> = {},
): GroupSettlement {
  return {
    id: "settlement-1",
    groupId: "user-a__group-1",
    participantIds: ["user-a", "user-b"],
    pairId: "user-a__user-b",
    fromUserId: "user-b",
    toUserId: "user-a",
    amountCents: 500,
    currency: "EUR",
    date: "2026-11-11",
    note: "",
    createdBy: "user-b",
    createdAt: "2026-11-11T10:00:00.000Z",
    updatedAt: "2026-11-11T10:00:00.000Z",
    deletedAt: null,
    receiverWalletId: null,
    receiverCategoryId: null,
    receiverTransactionId: null,
    ...overrides,
  };
}

describe("buildGroupTimeline", () => {
  it("returns an empty timeline when there are no records", () => {
    expect(buildGroupTimeline({ expenses: [], settlements: [] })).toEqual([]);
  });

  it("interleaves expenses and settlements newest first", () => {
    const olderExpense = buildGroupExpense({
      id: "expense-old",
      date: "2026-11-01",
    });
    const newerSettlement = buildSettlement({
      id: "settlement-new",
      date: "2026-11-12",
    });
    const middleExpense = buildGroupExpense({
      id: "expense-middle",
      date: "2026-11-05",
    });

    const timeline = buildGroupTimeline({
      expenses: [olderExpense, middleExpense],
      settlements: [newerSettlement],
    });

    expect(timeline.map((entry) => entry.key)).toEqual([
      "settlement:settlement-new",
      "expense:expense-middle",
      "expense:expense-old",
    ]);
    expect(timeline.map((entry) => entry.kind)).toEqual([
      "settlement",
      "expense",
      "expense",
    ]);
  });

  it("keeps the original records instead of copies", () => {
    const expense = buildGroupExpense({ id: "expense-1" });
    const settlement = buildSettlement({ id: "settlement-1" });

    const timeline = buildGroupTimeline({
      expenses: [expense],
      settlements: [settlement],
    });
    const entries = timeline.map((entry) =>
      entry.kind === "expense" ? entry.expense : entry.settlement,
    );

    expect(entries).toContain(expense);
    expect(entries).toContain(settlement);
  });

  it("orders equal dates by createdAt descending", () => {
    const expense = buildGroupExpense({
      id: "expense-first",
      date: "2026-11-10",
      createdAt: "2026-11-10T08:00:00.000Z",
    });
    const settlement = buildSettlement({
      id: "settlement-second",
      date: "2026-11-10",
      createdAt: "2026-11-10T18:00:00.000Z",
    });

    const timeline = buildGroupTimeline({
      expenses: [expense],
      settlements: [settlement],
    });

    expect(timeline.map((entry) => entry.key)).toEqual([
      "settlement:settlement-second",
      "expense:expense-first",
    ]);
  });

  it("falls back to the key when date and createdAt are equal", () => {
    const expense = buildGroupExpense({
      id: "b-expense",
      date: "2026-11-10",
      createdAt: "2026-11-10T18:00:00.000Z",
    });
    const settlement = buildSettlement({
      id: "a-settlement",
      date: "2026-11-10",
      createdAt: "2026-11-10T18:00:00.000Z",
    });

    const timeline = buildGroupTimeline({
      expenses: [expense],
      settlements: [settlement],
    });

    expect(timeline.map((entry) => entry.key)).toEqual([
      "expense:b-expense",
      "settlement:a-settlement",
    ]);
  });

  it("drops soft-deleted expenses and settlements", () => {
    const activeExpense = buildGroupExpense({ id: "active-expense" });
    const deletedExpense = buildGroupExpense({
      id: "deleted-expense",
      date: "2026-11-20",
      deletedAt: "2026-11-21T10:00:00.000Z",
    });
    const activeSettlement = buildSettlement({ id: "active-settlement" });
    const deletedSettlement = buildSettlement({
      id: "deleted-settlement",
      date: "2026-11-22",
      deletedAt: "2026-11-23T10:00:00.000Z",
    });

    const timeline = buildGroupTimeline({
      expenses: [activeExpense, deletedExpense],
      settlements: [activeSettlement, deletedSettlement],
    });

    expect(timeline.map((entry) => entry.key)).toEqual([
      "settlement:active-settlement",
      "expense:active-expense",
    ]);
  });

  it("does not mutate the input lists", () => {
    const expenses = [
      buildGroupExpense({ id: "old", date: "2026-11-01" }),
      buildGroupExpense({ id: "new", date: "2026-11-02" }),
    ];
    const settlements = [buildSettlement({ id: "settlement" })];
    const expenseCopy = [...expenses];
    const settlementCopy = [...settlements];

    buildGroupTimeline({ expenses, settlements });

    expect(expenses).toEqual(expenseCopy);
    expect(settlements).toEqual(settlementCopy);
  });
});
