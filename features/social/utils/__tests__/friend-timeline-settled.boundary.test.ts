import { describe, expect, it } from "@jest/globals";

import { findSettlingSettlement } from "../friend-timeline-settled";
import {
  buildFriendExpense,
  buildFullSettlement,
  buildViewerExpense,
  friendUid,
  groupsOf,
  viewerUid,
} from "./friend-timeline-settled.fixtures";

describe("findSettlingSettlement", () => {
  it("returns null without settlements", () => {
    expect(groupsOf([buildViewerExpense()], []).boundary).toBeNull();
  });

  it("returns null for an unknown or self pair", () => {
    const input = {
      expenses: [buildViewerExpense()],
      settlements: [buildFullSettlement()],
    };

    expect(
      findSettlingSettlement({ ...input, viewerUid: " ", friendUid }),
    ).toBeNull();
    expect(
      findSettlingSettlement({ ...input, viewerUid, friendUid: "" }),
    ).toBeNull();
    expect(
      findSettlingSettlement({ ...input, viewerUid, friendUid: viewerUid }),
    ).toBeNull();
  });

  it("finds the settlement that clears a viewer-paid expense", () => {
    const settlement = buildFullSettlement();

    expect(
      groupsOf([buildViewerExpense()], [settlement]).boundary?.id,
    ).toBe(settlement.id);
  });

  it("finds the settlement that clears a friend-paid expense", () => {
    const settlement = buildFullSettlement({
      id: "settlement-reverse",
      fromUserId: viewerUid,
      toUserId: friendUid,
    });

    expect(
      groupsOf([buildFriendExpense()], [settlement]).boundary?.id,
    ).toBe(settlement.id);
  });

  it("ignores a partial settlement", () => {
    const partial = buildFullSettlement({ amountCents: 200 });

    expect(groupsOf([buildViewerExpense()], [partial]).boundary).toBeNull();
  });

  it("ignores a settlement that clears only one currency", () => {
    const usdExpense = buildViewerExpense({
      id: "expense-usd",
      currency: "USD",
      createdAt: "2026-11-10T21:00:00.000Z",
    });

    expect(
      groupsOf([buildViewerExpense(), usdExpense], [buildFullSettlement()])
        .boundary,
    ).toBeNull();
  });

  it("ignores soft-deleted expenses and settlements", () => {
    const deletedExpense = buildViewerExpense({
      id: "expense-deleted",
      amountCents: 900,
      deletedAt: "2026-11-11T10:00:00.000Z",
      createdAt: "2026-11-10T22:00:00.000Z",
    });
    const deletedSettlement = buildFullSettlement({
      id: "settlement-deleted",
      amountCents: 400,
      deletedAt: "2026-11-11T10:00:00.000Z",
      createdAt: "2026-11-11T08:00:00.000Z",
    });

    expect(
      groupsOf(
        [buildViewerExpense(), deletedExpense],
        [buildFullSettlement(), deletedSettlement],
      ).boundary?.id,
    ).toBe("settlement-1");
  });

  it("breaks equal createdAt ties by settlement id", () => {
    const first = buildFullSettlement({
      id: "settlement-a",
      amountCents: 200,
      createdAt: "2026-11-11T09:00:00.000Z",
    });
    const second = buildFullSettlement({
      id: "settlement-b",
      amountCents: 300,
      createdAt: "2026-11-11T09:00:00.000Z",
    });

    expect(
      groupsOf([buildViewerExpense()], [second, first]).boundary?.id,
    ).toBe("settlement-b");
  });
});
