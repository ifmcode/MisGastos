import { describe, expect, it } from "@jest/globals";

import { buildSettlement } from "./settlement.fixtures";
import {
  buildSettlementLedgerEntries,
  filterActiveSettlements,
  getSettlementLedgerId,
  isActiveSettlement,
} from "../settlement-ledger";
import { getLatestSettlement, getPairSettlements, sortSettlements } from "../settlement-latest";

describe("settlement ledger", () => {
  it("emits the reverse edge so a settlement cancels debt", () => {
    const [entry] = buildSettlementLedgerEntries([buildSettlement()]);

    expect(entry).toEqual({
      id: "settlement:settlement-1",
      fromUserId: "user-b",
      toUserId: "user-a",
      amountCents: 1000,
      currency: "EUR",
      deletedAt: null,
    });
  });

  it("never folds a soft-deleted settlement", () => {
    const entries = buildSettlementLedgerEntries([
      buildSettlement({ id: "active" }),
      buildSettlement({ id: "deleted", deletedAt: "2026-11-16T10:00:00.000Z" }),
    ]);

    expect(entries).toHaveLength(1);
    expect(entries[0].id).toBe("settlement:active");
  });

  it("keeps the ledger id deterministic and prefixed", () => {
    expect(getSettlementLedgerId("abc")).toBe("settlement:abc");
  });

  it("treats an empty deletedAt as active", () => {
    expect(isActiveSettlement(buildSettlement({ deletedAt: "" }))).toBe(true);
    expect(
      isActiveSettlement(buildSettlement({ deletedAt: "2026-11-16" })),
    ).toBe(false);
    expect(
      filterActiveSettlements([
        buildSettlement({ id: "a" }),
        buildSettlement({ id: "b", deletedAt: "2026-11-16" }),
      ]).map((settlement) => settlement.id),
    ).toEqual(["a"]);
  });
});

describe("sortSettlements", () => {
  it("sorts by date, then updated creation, then id", () => {
    const sorted = sortSettlements([
      buildSettlement({ id: "b", date: "2026-11-10" }),
      buildSettlement({ id: "a", date: "2026-11-12" }),
      buildSettlement({
        id: "c",
        date: "2026-11-10",
        createdAt: "2026-11-11T10:00:00.000Z",
      }),
    ]);

    expect(sorted.map((settlement) => settlement.id)).toEqual(["a", "c", "b"]);
  });
});

describe("getLatestSettlement", () => {
  it("returns the newest active settlement", () => {
    const latest = getLatestSettlement([
      buildSettlement({ id: "old", date: "2026-11-01" }),
      buildSettlement({ id: "new", date: "2026-11-12" }),
      buildSettlement({
        id: "deleted",
        date: "2026-11-13",
        deletedAt: "2026-11-14T10:00:00.000Z",
      }),
    ]);

    expect(latest?.id).toBe("new");
  });

  it("returns null without active settlements", () => {
    expect(getLatestSettlement([])).toBeNull();
    expect(
      getLatestSettlement([
        buildSettlement({ deletedAt: "2026-11-14T10:00:00.000Z" }),
      ]),
    ).toBeNull();
  });
});

describe("getPairSettlements", () => {
  const settlements = [
    buildSettlement({ id: "pair-1", date: "2026-11-01" }),
    buildSettlement({
      id: "pair-2",
      date: "2026-11-05",
      participantIds: ["user-a", "user-b"],
      pairId: "user-a__user-b",
    }),
    buildSettlement({
      id: "other-pair",
      participantIds: ["user-a", "user-c"],
      pairId: "user-a__user-c",
    }),
  ];

  it("keeps only the pair, newest first", () => {
    expect(
      getPairSettlements(settlements, "user-a", "user-b").map(
        (settlement) => settlement.id,
      ),
    ).toEqual(["pair-2", "pair-1"]);
  });

  it("returns nothing for an empty or repeated viewer", () => {
    expect(getPairSettlements(settlements, "", "user-b")).toEqual([]);
    expect(getPairSettlements(settlements, "user-a", "user-a")).toEqual([]);
  });
});
