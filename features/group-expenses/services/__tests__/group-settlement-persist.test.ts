import { describe, expect, it } from "@jest/globals";

import {
  buildCreateGroupSettlementDto,
  buildGroupSettlementParticipantIds,
  buildUpdateGroupSettlementDto,
  getGroupSettlementCounterpart,
} from "../group-settlement-persist";
import { GroupExpenseOperationError } from "../group-expense.errors";
import { buildGroupSettlement } from "./group-settlements-service.fakes";
import { buildSettlementInput } from "./group-settlements-service.harness";

const NOW = "2026-11-20T10:00:00.000Z";

/** Reads the normalized value of the form, which the persist helpers accept. */
function value(overrides: Record<string, string> = {}) {
  const input = buildSettlementInput(overrides as never);

  return {
    groupId: input.groupId,
    fromUserId: input.fromUserId,
    toUserId: input.toUserId,
    amountCents: 1000,
    currency: "EUR" as const,
    date: input.date,
    note: "Dinner",
    walletId: null,
    categoryId: null,
  };
}

describe("buildGroupSettlementParticipantIds", () => {
  it("sorts the pair and keeps exactly two ids", () => {
    expect(buildGroupSettlementParticipantIds("user-c", "user-b")).toEqual([
      "user-b",
      "user-c",
    ]);
    expect(buildGroupSettlementParticipantIds("user-b", "user-c")).toEqual([
      "user-b",
      "user-c",
    ]);
  });

  it("rejects a blank or repeated id", () => {
    expect(() => buildGroupSettlementParticipantIds(" ", "user-b")).toThrow(
      GroupExpenseOperationError,
    );
    expect(() =>
      buildGroupSettlementParticipantIds("user-b", "user-b"),
    ).toThrow(GroupExpenseOperationError);
  });
});

describe("getGroupSettlementCounterpart", () => {
  const settlement = buildGroupSettlement();

  it("returns the other member of the pair", () => {
    expect(getGroupSettlementCounterpart(settlement, "user-b")).toBe("user-c");
    expect(getGroupSettlementCounterpart(settlement, "user-c")).toBe("user-b");
  });

  it("rejects a viewer outside the pair", () => {
    expect(() => getGroupSettlementCounterpart(settlement, "user-a")).toThrow(
      "NOT_SETTLEMENT_PARTICIPANT",
    );
  });
});

describe("buildCreateGroupSettlementDto", () => {
  it("drops a wallet sent by the debtor", () => {
    const dto = buildCreateGroupSettlementDto({
      value: { ...value(), walletId: "wallet-1", categoryId: "category-1" },
      participantIds: ["user-b", "user-c"],
      viewerUid: "user-b",
      now: NOW,
    });

    expect(dto).toMatchObject({
      pairId: "user-b__user-c",
      createdBy: "user-b",
      createdAt: NOW,
      updatedAt: NOW,
      deletedAt: null,
      receiverWalletId: null,
      receiverCategoryId: null,
      receiverTransactionId: null,
    });
  });

  it("keeps the creditor link", () => {
    const dto = buildCreateGroupSettlementDto({
      value: { ...value(), walletId: "wallet-1", categoryId: "category-1" },
      participantIds: ["user-b", "user-c"],
      viewerUid: "user-c",
      now: NOW,
    });

    expect(dto).toMatchObject({
      receiverWalletId: "wallet-1",
      receiverCategoryId: "category-1",
    });
  });
});

describe("buildUpdateGroupSettlementDto", () => {
  const existing = buildGroupSettlement({
    receiverWalletId: "wallet-1",
    receiverCategoryId: "category-1",
    receiverTransactionId: "movement-1",
  });

  it("keeps the stored link on a debtor edit", () => {
    expect(
      buildUpdateGroupSettlementDto({
        value: value(),
        existing,
        viewerUid: "user-b",
        now: NOW,
      }),
    ).toMatchObject({
      receiverWalletId: "wallet-1",
      receiverCategoryId: "category-1",
      updatedAt: NOW,
    });
  });

  it("lets the creditor unlink and clears the category", () => {
    expect(
      buildUpdateGroupSettlementDto({
        value: value(),
        existing,
        viewerUid: "user-c",
        now: NOW,
      }),
    ).toMatchObject({ receiverWalletId: null, receiverCategoryId: null });
  });
});
