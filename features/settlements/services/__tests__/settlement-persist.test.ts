import { describe, expect, it } from "@jest/globals";

import { buildSettlement } from "../../repositories/__tests__/settlement-document.fixtures";
import {
  buildSettlementParticipantIds,
  buildUpdateSettlementDto as buildUpdateDto,
  getSettlementRecipient,
  resolveCanLinkWallet,
} from "../settlement-persist";

describe("buildSettlementParticipantIds", () => {
  it("sorts the pair", () => {
    expect(buildSettlementParticipantIds("user-b", "user-a")).toEqual([
      "user-a",
      "user-b",
    ]);
  });

  it("rejects an invalid pair", () => {
    expect(() => buildSettlementParticipantIds("user-a", "user-a")).toThrow(
      "FRIEND_NOT_FOUND",
    );
  });
});

describe("getSettlementRecipient", () => {
  it("returns the other participant", () => {
    expect(getSettlementRecipient(buildSettlement(), "user-a")).toBe("user-b");
  });

  it("rejects an outsider", () => {
    expect(() => getSettlementRecipient(buildSettlement(), "user-c")).toThrow(
      "NOT_PARTICIPANT",
    );
    expect(() =>
      getSettlementRecipient(
        buildSettlement({ participantIds: ["user-a"] }),
        "user-a",
      ),
    ).toThrow("NOT_PARTICIPANT");
  });
});

describe("buildUpdateSettlementDto", () => {
  const value = {
    friendUid: "user-b",
    amountCents: 800,
    currency: "EUR" as const,
    date: "2026-11-16",
    note: "Thanks",
    walletId: "wallet-1",
    categoryId: "category-1",
  };

  it("applies the creditor link", () => {
    expect(
      buildUpdateDto({
        value,
        existing: buildSettlement({ toUserId: "user-a" }),
        viewerUid: "user-a",
        now: "now",
      }),
    ).toMatchObject({
      receiverWalletId: "wallet-1",
      receiverCategoryId: "category-1",
      amountCents: 800,
      updatedAt: "now",
    });
  });

  it("keeps the stored link for a debtor edit", () => {
    expect(
      buildUpdateDto({
        value: { ...value, walletId: null, categoryId: null },
        existing: buildSettlement({
          toUserId: "user-b",
          receiverWalletId: "wallet-9",
          receiverCategoryId: "category-9",
          receiverTransactionId: "movement-9",
        }),
        viewerUid: "user-a",
        now: "now",
      }),
    ).toMatchObject({
      receiverWalletId: "wallet-9",
      receiverCategoryId: "category-9",
    });
  });

  it("clears the category when the creditor unlinks", () => {
    expect(
      buildUpdateDto({
        value: { ...value, walletId: null, categoryId: null },
        existing: buildSettlement({ toUserId: "user-a" }),
        viewerUid: "user-a",
        now: "now",
      }),
    ).toMatchObject({ receiverWalletId: null, receiverCategoryId: null });
  });
});

describe("resolveCanLinkWallet", () => {
  const settlement = buildSettlement({ toUserId: "user-b" });

  it("offers the link to a creditor without movement", () => {
    expect(
      resolveCanLinkWallet({
        settlement,
        recipientUid: "user-b",
        viewerIsCreditor: false,
        walletId: null,
      }),
    ).toBe(true);
  });

  it("never offers it to the debtor", () => {
    expect(
      resolveCanLinkWallet({
        settlement,
        recipientUid: "user-a",
        viewerIsCreditor: true,
        walletId: "wallet-1",
      }),
    ).toBe(false);
  });

  it("hides it once a movement exists in either direction", () => {
    expect(
      resolveCanLinkWallet({
        settlement,
        recipientUid: "user-b",
        viewerIsCreditor: true,
        walletId: "wallet-1",
      }),
    ).toBe(false);
    expect(
      resolveCanLinkWallet({
        settlement: buildSettlement({
          toUserId: "user-b",
          receiverTransactionId: "movement-1",
        }),
        recipientUid: "user-b",
        viewerIsCreditor: false,
        walletId: null,
      }),
    ).toBe(false);
  });
});
