import { describe, expect, it } from "@jest/globals";

import {
  buildFullSettlement,
  buildViewerExpense,
  groupsOf,
} from "./friend-timeline-settled.fixtures";

describe("buildFriendTimelineGroups", () => {
  it("keeps every entry current when there is no settlement", () => {
    const groups = groupsOf([buildViewerExpense()], []);

    expect(groups.current.map((entry) => entry.key)).toEqual([
      "expense:expense-1",
    ]);
    expect(groups.settled).toEqual([]);
    expect(groups.boundary).toBeNull();
  });

  it("moves the whole cycle to settled after a full settlement", () => {
    const settlement = buildFullSettlement();
    const groups = groupsOf([buildViewerExpense()], [settlement]);

    expect(groups.current).toEqual([]);
    expect(groups.settled.map((entry) => entry.key)).toEqual([
      "settlement:settlement-1",
      "expense:expense-1",
    ]);
    expect(groups.boundary?.id).toBe(settlement.id);
  });

  it("keeps only the new expense current after a new expense", () => {
    const newExpense = buildViewerExpense({
      id: "expense-new",
      createdAt: "2026-11-12T20:00:00.000Z",
      date: "2026-11-12",
    });
    const groups = groupsOf(
      [buildViewerExpense(), newExpense],
      [buildFullSettlement()],
    );

    expect(groups.current.map((entry) => entry.key)).toEqual([
      "expense:expense-new",
    ]);
    expect(groups.settled.map((entry) => entry.key)).toEqual([
      "settlement:settlement-1",
      "expense:expense-1",
    ]);
    expect(groups.boundary?.id).toBe("settlement-1");
  });

  it("ignores a partial settlement and keeps everything current", () => {
    const groups = groupsOf(
      [buildViewerExpense()],
      [buildFullSettlement({ amountCents: 200 })],
    );

    expect(groups.boundary).toBeNull();
    expect(groups.current.map((entry) => entry.key)).toEqual([
      "settlement:settlement-1",
      "expense:expense-1",
    ]);
    expect(groups.settled).toEqual([]);
  });

  it("moves the boundary to the second full settlement", () => {
    const secondExpense = buildViewerExpense({
      id: "expense-2",
      createdAt: "2026-11-12T20:00:00.000Z",
      date: "2026-11-12",
    });
    const secondSettlement = buildFullSettlement({
      id: "settlement-2",
      createdAt: "2026-11-13T09:00:00.000Z",
      date: "2026-11-13",
    });
    const laterExpense = buildViewerExpense({
      id: "expense-3",
      createdAt: "2026-11-14T20:00:00.000Z",
      date: "2026-11-14",
    });

    const groups = groupsOf(
      [buildViewerExpense(), secondExpense, laterExpense],
      [buildFullSettlement(), secondSettlement],
    );

    expect(groups.boundary?.id).toBe("settlement-2");
    expect(groups.current.map((entry) => entry.key)).toEqual([
      "expense:expense-3",
    ]);
    expect(groups.settled.map((entry) => entry.key)).toEqual([
      "settlement:settlement-2",
      "expense:expense-2",
      "settlement:settlement-1",
      "expense:expense-1",
    ]);
  });

  it("keeps a past-dated expense current when it was written later", () => {
    const pastDated = buildViewerExpense({
      id: "expense-past",
      date: "2026-10-01",
      createdAt: "2026-11-12T09:00:00.000Z",
    });

    const groups = groupsOf(
      [buildViewerExpense(), pastDated],
      [buildFullSettlement()],
    );

    expect(groups.current.map((entry) => entry.key)).toEqual([
      "expense:expense-past",
    ]);
    expect(groups.settled.map((entry) => entry.key)).toEqual([
      "settlement:settlement-1",
      "expense:expense-1",
    ]);
  });
});
