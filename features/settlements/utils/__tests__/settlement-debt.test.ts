import { describe, expect, it } from "@jest/globals";

import { buildSettlement } from "./settlement.fixtures";
import {
  canEditSettlementAmount,
  getCurrencyNetBalanceCents,
  getOutstandingDebtCents,
  getSettlementDebtorCreditor,
  getSettlementDirection,
  isAmountWithinDebt,
  isSettlementFull,
} from "../settlement-debt";

describe("getSettlementDirection", () => {
  it("reads the sign of the net balance", () => {
    expect(getSettlementDirection(1500)).toBe("friend-owes-viewer");
    expect(getSettlementDirection(-1500)).toBe("viewer-owes-friend");
    expect(getSettlementDirection(0)).toBe("settled");
  });
});

describe("getSettlementDebtorCreditor", () => {
  it("makes the friend the debtor when the friend owes the viewer", () => {
    expect(
      getSettlementDebtorCreditor({
        viewerUid: "user-a",
        friendUid: "user-b",
        netBalanceCents: 1000,
      }),
    ).toEqual({
      fromUserId: "user-b",
      toUserId: "user-a",
      viewerIsCreditor: true,
    });
  });

  it("makes the viewer the debtor when the viewer owes the friend", () => {
    expect(
      getSettlementDebtorCreditor({
        viewerUid: "user-a",
        friendUid: "user-b",
        netBalanceCents: -1000,
      }),
    ).toEqual({
      fromUserId: "user-a",
      toUserId: "user-b",
      viewerIsCreditor: false,
    });
  });

  it("returns null when nothing is owed", () => {
    expect(
      getSettlementDebtorCreditor({
        viewerUid: "user-a",
        friendUid: "user-b",
        netBalanceCents: 0,
      }),
    ).toBeNull();
  });
});

describe("balance helpers", () => {
  const balances = [
    { currency: "EUR" as const, netBalanceCents: -2500 },
    { currency: "USD" as const, netBalanceCents: 400 },
  ];

  it("reads the signed net of one currency", () => {
    expect(getCurrencyNetBalanceCents(balances, "EUR")).toBe(-2500);
    expect(getCurrencyNetBalanceCents(balances, "GBP")).toBe(0);
  });

  it("returns the outstanding debt as an absolute value", () => {
    expect(getOutstandingDebtCents(balances, "EUR")).toBe(2500);
    expect(getOutstandingDebtCents(balances, "USD")).toBe(400);
    expect(getOutstandingDebtCents(balances, "GBP")).toBe(0);
  });
});

describe("isAmountWithinDebt", () => {
  it("accepts a partial or a full amount", () => {
    expect(isAmountWithinDebt(1, 1000)).toBe(true);
    expect(isAmountWithinDebt(1000, 1000)).toBe(true);
  });

  it("rejects zero, over the bound and a settled currency", () => {
    expect(isAmountWithinDebt(0, 1000)).toBe(false);
    expect(isAmountWithinDebt(1001, 1000)).toBe(false);
    expect(isAmountWithinDebt(100, 0)).toBe(false);
    expect(isAmountWithinDebt(-100, 1000)).toBe(false);
  });
});

describe("canEditSettlementAmount", () => {
  it("always lets the creditor edit their own movement", () => {
    const settlement = buildSettlement({
      toUserId: "user-b",
      receiverTransactionId: "movement-1",
    });

    expect(canEditSettlementAmount(settlement, "user-b")).toBe(true);
  });

  it("lets the debtor edit while no movement exists", () => {
    expect(canEditSettlementAmount(buildSettlement(), "user-a")).toBe(true);
  });

  it("locks the amount for the debtor once the creditor linked a movement", () => {
    const settlement = buildSettlement({
      receiverWalletId: "wallet-1",
      receiverCategoryId: "category-1",
      receiverTransactionId: "movement-1",
    });

    expect(canEditSettlementAmount(settlement, "user-a")).toBe(false);
  });
});

describe("isSettlementFull", () => {
  it("is full when it clears the only currency of the pair", () => {
    const balances = [{ currency: "EUR" as const, netBalanceCents: -1000 }];

    expect(isSettlementFull(balances, "EUR", 1000)).toBe(true);
    expect(isSettlementFull(balances, "EUR", 999)).toBe(false);
  });

  it("is full when the friend owes the viewer and pays the whole debt", () => {
    const balances = [{ currency: "EUR" as const, netBalanceCents: 1000 }];

    expect(isSettlementFull(balances, "EUR", 1000)).toBe(true);
  });

  it("is never full while another currency still has debt", () => {
    const balances = [
      { currency: "EUR" as const, netBalanceCents: -1000 },
      { currency: "USD" as const, netBalanceCents: -500 },
    ];

    expect(isSettlementFull(balances, "EUR", 1000)).toBe(false);
  });

  it("is never full with a zero amount, an overpayment or a settled currency", () => {
    const balances = [{ currency: "EUR" as const, netBalanceCents: -1000 }];

    expect(isSettlementFull(balances, "EUR", 0)).toBe(false);
    expect(isSettlementFull(balances, "EUR", 2000)).toBe(false);
    expect(isSettlementFull([], "EUR", 1000)).toBe(false);
  });
});
