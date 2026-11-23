import { describe, expect, it } from "@jest/globals";

import type { GroupSettlement } from "../../types/group-settlement.types";
import { sortGroupSettlements } from "../group-settlement-order";

function build(overrides: Partial<GroupSettlement>): GroupSettlement {
  return {
    id: "settlement-1",
    groupId: "user-a__group-1",
    participantIds: ["user-b", "user-c"],
    pairId: "user-b__user-c",
    fromUserId: "user-b",
    toUserId: "user-c",
    amountCents: 1000,
    currency: "EUR",
    date: "2026-11-10",
    note: "",
    createdBy: "user-b",
    createdAt: "2026-11-10T10:00:00.000Z",
    updatedAt: "2026-11-10T10:00:00.000Z",
    deletedAt: null,
    receiverWalletId: null,
    receiverCategoryId: null,
    receiverTransactionId: null,
    ...overrides,
  };
}

describe("sortGroupSettlements", () => {
  it("orders by date, then creation, then id ascending", () => {
    const sorted = sortGroupSettlements([
      build({ id: "old", date: "2026-11-09" }),
      build({ id: "b", date: "2026-11-10" }),
      build({ id: "a", date: "2026-11-10" }),
      build({
        id: "newer-write",
        date: "2026-11-10",
        createdAt: "2026-11-11T10:00:00.000Z",
      }),
    ]);

    expect(sorted.map((settlement) => settlement.id)).toEqual([
      "newer-write",
      "a",
      "b",
      "old",
    ]);
  });

  it("does not mutate the input list", () => {
    const rows = [build({ id: "old", date: "2026-11-09" }), build({ id: "new", date: "2026-11-10" })];
    const copy = [...rows];

    sortGroupSettlements(rows);

    expect(rows).toEqual(copy);
  });
});
