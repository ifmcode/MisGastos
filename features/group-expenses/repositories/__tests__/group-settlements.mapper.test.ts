import { describe, expect, it } from "@jest/globals";

import { mapGroupSettlementDocument } from "../group-settlements.mapper";
import {
  toGroupSettlementData,
  toGroupSettlementUpdateData,
} from "../group-settlements.data";
import { groupSettlementDocument } from "./group-settlements-repository.test-helpers";

describe("mapGroupSettlementDocument", () => {
  it("maps a social-only settlement", () => {
    expect(
      mapGroupSettlementDocument("settlement-1", groupSettlementDocument()),
    ).toEqual({
      id: "settlement-1",
      groupId: "user-a__group-1",
      participantIds: ["user-b", "user-c"],
      pairId: "user-b__user-c",
      fromUserId: "user-b",
      toUserId: "user-c",
      amountCents: 1000,
      currency: "EUR",
      date: "2026-11-10",
      note: "Dinner",
      createdBy: "user-b",
      createdAt: "2026-11-10T20:00:00.000Z",
      updatedAt: "2026-11-10T20:00:00.000Z",
      deletedAt: null,
      receiverWalletId: null,
      receiverCategoryId: null,
      receiverTransactionId: null,
    });
  });

  it("maps a linked settlement and trims every optional id", () => {
    expect(
      mapGroupSettlementDocument(
        "settlement-1",
        groupSettlementDocument({
          receiverWalletId: " wallet-1 ",
          receiverCategoryId: " category-1 ",
          receiverTransactionId: " movement-1 ",
          note: "  Dinner  ",
        }),
      ),
    ).toMatchObject({
      receiverWalletId: "wallet-1",
      receiverCategoryId: "category-1",
      receiverTransactionId: "movement-1",
      note: "Dinner",
    });
  });

  it("derives the pair id when the stored one is missing", () => {
    expect(
      mapGroupSettlementDocument(
        "settlement-1",
        groupSettlementDocument({ pairId: "" }),
      )?.pairId,
    ).toBe("user-b__user-c");
  });

  it.each([
    ["an empty id", "", groupSettlementDocument()],
    ["a missing group", "settlement-1", groupSettlementDocument({ groupId: " " })],
    [
      "a single participant",
      "settlement-1",
      groupSettlementDocument({ participantIds: ["user-b"] }),
    ],
    [
      "an unsorted pair",
      "settlement-1",
      groupSettlementDocument({ participantIds: ["user-c", "user-b"] }),
    ],
    [
      "a mismatched pair id",
      "settlement-1",
      groupSettlementDocument({ pairId: "user-a__user-b" }),
    ],
    [
      "a debtor outside the pair",
      "settlement-1",
      groupSettlementDocument({ fromUserId: "user-a" }),
    ],
    [
      "the same user on both sides",
      "settlement-1",
      groupSettlementDocument({
        participantIds: ["user-b", "user-b"],
        pairId: "user-b__user-b",
        fromUserId: "user-b",
        toUserId: "user-b",
      }),
    ],
    [
      "a zero amount",
      "settlement-1",
      groupSettlementDocument({ amountCents: 0 }),
    ],
    [
      "a decimal amount",
      "settlement-1",
      groupSettlementDocument({ amountCents: 10.5 }),
    ],
    [
      "an oversized amount",
      "settlement-1",
      groupSettlementDocument({ amountCents: 100_000_001 }),
    ],
    [
      "an invalid currency",
      "settlement-1",
      groupSettlementDocument({ currency: "BIT" }),
    ],
    [
      "an invalid date",
      "settlement-1",
      groupSettlementDocument({ date: "not-a-date" }),
    ],
    [
      "a missing creation stamp",
      "settlement-1",
      groupSettlementDocument({ createdBy: "" }),
    ],
    [
      "a missing createdAt",
      "settlement-1",
      groupSettlementDocument({ createdAt: "" }),
    ],
    [
      "a partial receiver link",
      "settlement-1",
      groupSettlementDocument({ receiverWalletId: "wallet-1" }),
    ],
  ])("drops a document with %s", (_label, id, data) => {
    expect(mapGroupSettlementDocument(id, data)).toBeNull();
  });
});

describe("group settlement document data", () => {
  const dto = {
    groupId: "user-a__group-1",
    participantIds: ["user-b", "user-c"],
    pairId: "user-b__user-c",
    fromUserId: "user-b",
    toUserId: "user-c",
    amountCents: 1000,
    currency: "EUR" as const,
    date: "2026-11-10",
    note: "Dinner",
    createdBy: "user-b",
    createdAt: "2026-11-10T20:00:00.000Z",
    updatedAt: "2026-11-10T20:00:00.000Z",
    deletedAt: null,
    receiverWalletId: null,
    receiverCategoryId: null,
    receiverTransactionId: null,
  };

  it("writes every key of a new settlement, nulls included", () => {
    expect(toGroupSettlementData(dto)).toEqual({
      ...dto,
    });
  });

  it("writes only the mutable slice on update", () => {
    expect(
      toGroupSettlementUpdateData({
        amountCents: 2000,
        date: "2026-11-11",
        note: "Cash",
        updatedAt: "2026-11-11T10:00:00.000Z",
        receiverWalletId: null,
        receiverCategoryId: null,
      }),
    ).toEqual({
      amountCents: 2000,
      date: "2026-11-11",
      note: "Cash",
      updatedAt: "2026-11-11T10:00:00.000Z",
      receiverWalletId: null,
      receiverCategoryId: null,
    });
  });

  it("travels the movement id only when the caller owns it", () => {
    const base = {
      amountCents: 2000,
      date: "2026-11-11",
      note: "Cash",
      updatedAt: "2026-11-11T10:00:00.000Z",
      receiverWalletId: "wallet-1",
      receiverCategoryId: "category-1",
    };

    expect(
      toGroupSettlementUpdateData({ ...base, receiverTransactionId: "movement-1" }),
    ).toMatchObject({ receiverTransactionId: "movement-1" });
    expect(toGroupSettlementUpdateData(base)).not.toHaveProperty(
      "receiverTransactionId",
    );
  });
});
