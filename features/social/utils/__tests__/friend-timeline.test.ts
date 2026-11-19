import { describe, expect, it } from "@jest/globals";

import { buildSharedExpense } from "@/features/shared-expenses/utils/__tests__/shared-expense.fixtures";
import { buildSettlement } from "@/features/settlements/utils/__tests__/settlement.fixtures";

import { buildFriendTimeline, getExpenseTimelineEffect } from "../friend-timeline";

const viewerUid = "user-a";
const friendUid = "user-b";

describe("buildFriendTimeline", () => {
  it("returns an empty timeline when there are no records", () => {
    expect(buildFriendTimeline({ expenses: [], settlements: [] })).toEqual([]);
  });

  it("interleaves expenses and settlements newest first", () => {
    const olderExpense = buildSharedExpense({
      id: "expense-old",
      date: "2026-11-01",
    });
    const newerSettlement = buildSettlement({
      id: "settlement-new",
      date: "2026-11-12",
    });
    const middleExpense = buildSharedExpense({
      id: "expense-middle",
      date: "2026-11-05",
    });

    const timeline = buildFriendTimeline({
      expenses: [olderExpense, middleExpense],
      settlements: [newerSettlement],
    });

    expect(timeline.map((entry) => entry.key)).toEqual([
      "settlement:settlement-new",
      "expense:expense-middle",
      "expense:expense-old",
    ]);
  });

  it("orders equal dates by createdAt descending", () => {
    const first = buildSharedExpense({
      id: "expense-first",
      date: "2026-11-10",
      createdAt: "2026-11-10T08:00:00.000Z",
    });
    const second = buildSettlement({
      id: "settlement-second",
      date: "2026-11-10",
      createdAt: "2026-11-10T18:00:00.000Z",
    });

    const timeline = buildFriendTimeline({
      expenses: [first],
      settlements: [second],
    });

    expect(timeline.map((entry) => entry.key)).toEqual([
      "settlement:settlement-second",
      "expense:expense-first",
    ]);
  });

  it("falls back to the key when date and createdAt are equal", () => {
    const expense = buildSharedExpense({
      id: "b-expense",
      date: "2026-11-10",
      createdAt: "2026-11-10T18:00:00.000Z",
    });
    const settlement = buildSettlement({
      id: "a-settlement",
      date: "2026-11-10",
      createdAt: "2026-11-10T18:00:00.000Z",
    });

    const timeline = buildFriendTimeline({
      expenses: [expense],
      settlements: [settlement],
    });

    expect(timeline.map((entry) => entry.key)).toEqual([
      "expense:b-expense",
      "settlement:a-settlement",
    ]);
  });

  it("drops soft-deleted expenses and settlements", () => {
    const activeExpense = buildSharedExpense({ id: "expense-active" });
    const deletedExpense = buildSharedExpense({
      id: "expense-deleted",
      deletedAt: "2026-11-11T10:00:00.000Z",
    });
    const activeSettlement = buildSettlement({ id: "settlement-active" });
    const deletedSettlement = buildSettlement({
      id: "settlement-deleted",
      deletedAt: "2026-11-11T10:00:00.000Z",
    });

    const timeline = buildFriendTimeline({
      expenses: [activeExpense, deletedExpense],
      settlements: [activeSettlement, deletedSettlement],
    });

    expect(timeline.map((entry) => entry.key)).toEqual([
      "expense:expense-active",
      "settlement:settlement-active",
    ]);
  });

  it("keeps stable, kind-prefixed keys and the source record", () => {
    const expense = buildSharedExpense({ id: "expense-1" });
    const settlement = buildSettlement({ id: "settlement-1" });

    const timeline = buildFriendTimeline({
      expenses: [expense],
      settlements: [settlement],
    });

    expect(timeline.map((entry) => entry.kind)).toEqual([
      "expense",
      "settlement",
    ]);
    expect(timeline[0]?.key).toBe("expense:expense-1");
    expect(timeline[1]?.key).toBe("settlement:settlement-1");
  });
});

describe("getExpenseTimelineEffect", () => {
  it("reports money lent when the viewer is the creditor", () => {
    const expense = buildSharedExpense({ currency: "USD" });

    expect(getExpenseTimelineEffect(expense, viewerUid)).toEqual({
      direction: "lent",
      amountCents: 500,
      currency: "USD",
    });
  });

  it("reports money borrowed when the viewer is the debtor", () => {
    const expense = buildSharedExpense();

    expect(getExpenseTimelineEffect(expense, friendUid)).toEqual({
      direction: "borrowed",
      amountCents: 500,
      currency: "EUR",
    });
  });

  it("returns null when the viewer share is zero", () => {
    const expense = buildSharedExpense({
      participants: [
        { userId: viewerUid, shareCents: 1000 },
        { userId: friendUid, shareCents: 0 },
      ],
    });

    expect(getExpenseTimelineEffect(expense, friendUid)).toBeNull();
  });

  it("returns null for an unknown or empty viewer", () => {
    const expense = buildSharedExpense();

    expect(getExpenseTimelineEffect(expense, "user-unknown")).toBeNull();
    expect(getExpenseTimelineEffect(expense, "")).toBeNull();
    expect(getExpenseTimelineEffect(expense, "   ")).toBeNull();
  });
});
