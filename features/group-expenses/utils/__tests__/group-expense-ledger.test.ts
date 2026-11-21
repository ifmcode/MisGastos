import { describe, expect, it } from "@jest/globals";

import {
  buildGroupExpenseLedgerEntries,
  filterActiveGroupExpenses,
  getGroupExpenseViewerShare,
  sortGroupExpenses,
} from "../group-expense-ledger";
import { GROUP_ID, buildGroupExpense } from "./group-expense.fixtures";

describe("filterActiveGroupExpenses", () => {
  it("drops soft-deleted records and keeps active ones", () => {
    const active = buildGroupExpense();
    const deleted = buildGroupExpense({
      id: "expense-2",
      deletedAt: "2026-11-11T10:00:00.000Z",
    });
    const blank = buildGroupExpense({ id: "expense-3", deletedAt: "" });

    // The repository maps an empty stamp to null, so `""` is never active.
    expect(filterActiveGroupExpenses([active, deleted, blank])).toEqual([
      active,
    ]);
  });
});

describe("sortGroupExpenses", () => {
  it("orders by date, then creation and then id, newest first", () => {
    const older = buildGroupExpense({
      id: "expense-1",
      date: "2026-11-09",
    });
    const sameDay = buildGroupExpense({
      id: "expense-b",
      date: "2026-11-10",
      createdAt: "2026-11-10T21:00:00.000Z",
    });
    const sameStamp = buildGroupExpense({
      id: "expense-a",
      date: "2026-11-10",
    });

    expect(
      sortGroupExpenses([older, sameDay, sameStamp]).map((item) => item.id),
    ).toEqual(["expense-b", "expense-a", "expense-1"]);
  });

  it("falls back to the id when date and creation are equal", () => {
    const first = buildGroupExpense({ id: "expense-a" });
    const second = buildGroupExpense({ id: "expense-b" });

    expect(
      sortGroupExpenses([second, first]).map((item) => item.id),
    ).toEqual(["expense-a", "expense-b"]);
    expect(
      sortGroupExpenses([first, second]).map((item) => item.id),
    ).toEqual(["expense-a", "expense-b"]);
  });

  it("compares both directions of the creation stamp", () => {
    const early = buildGroupExpense({
      id: "early",
      createdAt: "2026-11-10T10:00:00.000Z",
    });
    const late = buildGroupExpense({
      id: "late",
      createdAt: "2026-11-10T22:00:00.000Z",
    });

    expect(sortGroupExpenses([early, late]).map((item) => item.id)).toEqual([
      "late",
      "early",
    ]);
    expect(sortGroupExpenses([late, early]).map((item) => item.id)).toEqual([
      "late",
      "early",
    ]);
  });

  it("compares both directions of the spending day", () => {
    const older = buildGroupExpense({ id: "older", date: "2026-11-09" });
    const newer = buildGroupExpense({ id: "newer", date: "2026-11-12" });

    expect(sortGroupExpenses([older, newer]).map((item) => item.id)).toEqual([
      "newer",
      "older",
    ]);
    expect(sortGroupExpenses([newer, older]).map((item) => item.id)).toEqual([
      "newer",
      "older",
    ]);
  });

  it("does not mutate the input list", () => {
    const list = [
      buildGroupExpense({ id: "expense-b", date: "2026-11-09" }),
      buildGroupExpense({ id: "expense-a" }),
    ];

    sortGroupExpenses(list);

    expect(list.map((item) => item.id)).toEqual(["expense-b", "expense-a"]);
  });
});

describe("buildGroupExpenseLedgerEntries", () => {
  it("creates one row per non-payer participant with a positive share", () => {
    const expense = buildGroupExpense({
      participants: [
        { userId: "user-b", shareCents: 400 },
        { userId: "user-c", shareCents: 600 },
      ],
      payerId: "user-a",
    });

    expect(buildGroupExpenseLedgerEntries([expense])).toEqual([
      {
        id: "expense-1:user-b",
        groupId: GROUP_ID,
        fromUserId: "user-b",
        toUserId: "user-a",
        amountCents: 400,
        currency: "EUR",
      },
      {
        id: "expense-1:user-c",
        groupId: GROUP_ID,
        fromUserId: "user-c",
        toUserId: "user-a",
        amountCents: 600,
        currency: "EUR",
      },
    ]);
  });

  it("skips zero shares, the payer's own row and deleted expenses", () => {
    const zeroShare = buildGroupExpense({
      participants: [
        { userId: "user-a", shareCents: 1000 },
        { userId: "user-b", shareCents: 0 },
      ],
    });
    const deleted = buildGroupExpense({
      id: "expense-2",
      deletedAt: "2026-11-11T10:00:00.000Z",
    });

    expect(buildGroupExpenseLedgerEntries([zeroShare, deleted])).toEqual([]);
  });

  it("keeps the currency of the expense", () => {
    const entries = buildGroupExpenseLedgerEntries([
      buildGroupExpense({ currency: "JPY", amountCents: 9000 }),
    ]);

    expect(entries.map((entry) => entry.currency)).toEqual(["JPY"]);
  });
});

describe("getGroupExpenseViewerShare", () => {
  const expense = buildGroupExpense();

  it("returns the cents the viewer owes", () => {
    expect(getGroupExpenseViewerShare(expense, "user-b")).toBe(500);
    expect(getGroupExpenseViewerShare(expense, " user-b ")).toBe(500);
  });

  it("returns zero for the payer, a missing row or a blank viewer", () => {
    expect(getGroupExpenseViewerShare(expense, "user-a")).toBe(0);
    expect(getGroupExpenseViewerShare(expense, "user-z")).toBe(0);
    expect(getGroupExpenseViewerShare(expense, "")).toBe(0);
    expect(
      getGroupExpenseViewerShare(expense, null as unknown as string),
    ).toBe(0);
  });

  it("returns zero when the viewer share is zero", () => {
    const skipped = buildGroupExpense({
      participants: [{ userId: "user-b", shareCents: 0 }],
    });

    expect(getGroupExpenseViewerShare(skipped, "user-b")).toBe(0);
  });
});
