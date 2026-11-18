import { describe, expect, it } from "@jest/globals";

import { mapSettlementDocument } from "../settlements.mapper";
import { buildSettlementDocument } from "./settlement-document.fixtures";

describe("mapSettlementDocument", () => {
  it("maps a valid document and trims its strings", () => {
    const settlement = mapSettlementDocument(
      " settlement-1 ",
      buildSettlementDocument({ note: "  Dinner  ", date: " 2026-11-10 " }),
    );

    expect(settlement).toMatchObject({
      id: "settlement-1",
      pairId: "user-a__user-b",
      fromUserId: "user-a",
      toUserId: "user-b",
      amountCents: 1000,
      currency: "EUR",
      date: "2026-11-10",
      note: "Dinner",
      receiverWalletId: null,
    });
  });

  it("accepts a complete receiver link", () => {
    const settlement = mapSettlementDocument(
      "settlement-1",
      buildSettlementDocument({
        receiverWalletId: "wallet-1",
        receiverCategoryId: "category-1",
        receiverTransactionId: "movement-1",
      }),
    );

    expect(settlement).toMatchObject({
      receiverWalletId: "wallet-1",
      receiverCategoryId: "category-1",
      receiverTransactionId: "movement-1",
    });
  });

  it("derives a missing pairId from the sorted pair", () => {
    expect(
      mapSettlementDocument(
        "settlement-1",
        buildSettlementDocument({ pairId: "" }),
      )?.pairId,
    ).toBe("user-a__user-b");
  });

  it("drops malformed documents", () => {
    const document = buildSettlementDocument();

    expect(mapSettlementDocument("", document)).toBeNull();
    expect(
      mapSettlementDocument("id", {
        ...document,
        participantIds: ["user-b", "user-a"],
      }),
    ).toBeNull();
    expect(
      mapSettlementDocument("id", {
        ...document,
        participantIds: ["user-a"],
      }),
    ).toBeNull();
    expect(
      mapSettlementDocument("id", { ...document, pairId: "user-a__user-c" }),
    ).toBeNull();
    expect(
      mapSettlementDocument("id", { ...document, fromUserId: "user-c" }),
    ).toBeNull();
    expect(
      mapSettlementDocument("id", { ...document, toUserId: "user-a" }),
    ).toBeNull();
    expect(
      mapSettlementDocument("id", { ...document, amountCents: 0 }),
    ).toBeNull();
    expect(
      mapSettlementDocument("id", { ...document, amountCents: 10.5 }),
    ).toBeNull();
    expect(
      mapSettlementDocument("id", { ...document, currency: "BTC" }),
    ).toBeNull();
  });

  it("drops a partially set receiver link", () => {
    const document = buildSettlementDocument();

    expect(
      mapSettlementDocument("id", {
        ...document,
        receiverWalletId: "wallet-1",
      }),
    ).toBeNull();
    expect(
      mapSettlementDocument("id", {
        ...document,
        receiverWalletId: "wallet-1",
        receiverCategoryId: "category-1",
      }),
    ).toBeNull();
  });
});
