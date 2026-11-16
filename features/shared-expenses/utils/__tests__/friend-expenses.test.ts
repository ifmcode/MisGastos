import { describe, expect, it } from "@jest/globals";

import {
  filterFriendExpenses,
  getFriendExpenses,
  isFriendExpense,
} from "../friend-expenses";
import { buildSharedExpense as expense } from "./shared-expense.fixtures";

describe("isFriendExpense", () => {
  it("accepts an expense where both uids participate", () => {
    expect(isFriendExpense(expense(), "user-a", "user-b")).toBe(true);
  });

  it("rejects an expense of another pair", () => {
    expect(isFriendExpense(expense(), "user-a", "user-c")).toBe(false);
    expect(
      isFriendExpense(
        expense({ participantIds: ["user-c", "user-d"] }),
        "user-a",
        "user-b",
      ),
    ).toBe(false);
  });

  it("rejects the same uid on both sides", () => {
    expect(isFriendExpense(expense(), "user-a", "user-a")).toBe(false);
  });

  it("rejects empty uids", () => {
    expect(isFriendExpense(expense(), "", "user-b")).toBe(false);
    expect(isFriendExpense(expense(), "user-a", "  ")).toBe(false);
  });
});

describe("filterFriendExpenses", () => {
  it("keeps the input order of the active pair expenses", () => {
    const expenses = [
      expense({ id: "1", date: "2026-11-01" }),
      expense({ id: "2", date: "2026-11-15" }),
      expense({ id: "3", date: "2026-11-10" }),
    ];

    expect(filterFriendExpenses(expenses, "user-a", "user-b").map((e) => e.id))
      .toEqual(["1", "2", "3"]);
  });

  it("drops soft-deleted expenses", () => {
    const expenses = [
      expense({ id: "active" }),
      expense({ id: "deleted", deletedAt: "2026-11-14T00:00:00.000Z" }),
      expense({ id: "empty-deleted", deletedAt: "" }),
    ];

    expect(filterFriendExpenses(expenses, "user-a", "user-b").map((e) => e.id))
      .toEqual(["active", "empty-deleted"]);
  });

  it("drops expenses of other pairs", () => {
    const expenses = [
      expense({ id: "pair" }),
      expense({ id: "other", participantIds: ["user-c", "user-d"] }),
    ];

    expect(filterFriendExpenses(expenses, "user-a", "user-b").map((e) => e.id))
      .toEqual(["pair"]);
  });

  it("returns an empty list when the viewer and the friend are the same", () => {
    expect(filterFriendExpenses([expense()], "user-a", "user-a")).toEqual([]);
  });

  it("returns an empty list for an empty uid", () => {
    expect(filterFriendExpenses([expense()], "", "user-b")).toEqual([]);
    expect(filterFriendExpenses([expense()], "user-a", "")).toEqual([]);
  });

  it("never mutates the input array", () => {
    const expenses = [expense({ id: "1" }), expense({ id: "2", deletedAt: "" })];

    filterFriendExpenses(expenses, "user-a", "user-b");

    expect(expenses.map((item) => item.id)).toEqual(["1", "2"]);
    expect(expenses[1].deletedAt).toBe("");
  });
});

describe("getFriendExpenses", () => {
  it("orders the pair expenses newest first", () => {
    const expenses = [
      expense({ id: "old", date: "2026-11-01" }),
      expense({ id: "new", date: "2026-11-15" }),
      expense({ id: "middle", date: "2026-11-10" }),
    ];

    expect(getFriendExpenses(expenses, "user-a", "user-b").map((e) => e.id))
      .toEqual(["new", "middle", "old"]);
  });

  it("breaks date ties by createdAt descending", () => {
    const expenses = [
      expense({ id: "older", createdAt: "2026-11-10T10:00:00.000Z" }),
      expense({ id: "newer", createdAt: "2026-11-10T12:00:00.000Z" }),
    ];

    expect(getFriendExpenses(expenses, "user-a", "user-b").map((e) => e.id))
      .toEqual(["newer", "older"]);
  });

  it("filters and sorts without mutating the input", () => {
    const expenses = [
      expense({ id: "old", date: "2026-11-01" }),
      expense({ id: "deleted", date: "2026-11-20", deletedAt: "2026-11-21" }),
      expense({ id: "new", date: "2026-11-15" }),
    ];

    const result = getFriendExpenses(expenses, "user-a", "user-b");

    expect(result.map((item) => item.id)).toEqual(["new", "old"]);
    expect(expenses.map((item) => item.id)).toEqual(["old", "deleted", "new"]);
  });
});
