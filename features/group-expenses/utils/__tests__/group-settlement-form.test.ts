import { describe, expect, it } from "@jest/globals";

import type { GroupBalances, GroupDebt } from "../../types/group-balance.types";
import type { GroupSettlement } from "../../types/group-settlement.types";
import {
  createGroupSettlementEditFormValues,
  createGroupSettlementFormValues,
  findGroupSettlementDebt,
  formatGroupSettlementAmountInput,
  getGroupSettlementAmountIssue,
  getGroupSettlementDateIssue,
  getGroupSettlementEditBoundCents,
  getGroupSettlementViewerDirection,
  selectGroupSettlementWallet,
  toGroupSettlementInput,
} from "../group-settlement-form";
import type { GroupSettlementFormValues } from "../group-settlement-form.types";

const today = "2026-11-23";

function buildDebt(overrides: Partial<GroupDebt> = {}): GroupDebt {
  return {
    currency: "EUR",
    fromUserId: "debtor",
    toUserId: "creditor",
    amountCents: 2500,
    ...overrides,
  };
}

function buildBalances(debts: GroupDebt[]): GroupBalances {
  return { currencies: [], debts, simplifyDebts: true };
}

function buildSettlement(
  overrides: Partial<GroupSettlement> = {},
): GroupSettlement {
  return {
    id: "settlement-1",
    groupId: "group-1",
    participantIds: ["debtor", "creditor"],
    pairId: "creditor__debtor",
    fromUserId: "debtor",
    toUserId: "creditor",
    amountCents: 1000,
    currency: "EUR",
    date: "2026-11-20",
    note: "",
    createdBy: "debtor",
    createdAt: "2026-11-20T10:00:00.000Z",
    updatedAt: "2026-11-20T10:00:00.000Z",
    deletedAt: null,
    receiverWalletId: null,
    receiverCategoryId: null,
    receiverTransactionId: null,
    revision: 0,
    ...overrides,
  };
}

function buildValues(
  overrides: Partial<GroupSettlementFormValues> = {},
): GroupSettlementFormValues {
  return {
    viewerUid: "debtor",
    groupId: "group-1",
    currency: "EUR",
    fromUserId: "debtor",
    toUserId: "creditor",
    amount: "25,00",
    date: today,
    note: "",
    walletId: "",
    categoryId: "",
    ...overrides,
  };
}

describe("formatGroupSettlementAmountInput", () => {
  it("formats integer cents with two decimals", () => {
    expect(formatGroupSettlementAmountInput(2500)).toBe("25.00");
    expect(formatGroupSettlementAmountInput(5)).toBe("0.05");
  });

  it("rounds and normalizes non-finite values", () => {
    expect(formatGroupSettlementAmountInput(1000.6)).toBe("10.01");
    expect(formatGroupSettlementAmountInput(Number.NaN)).toBe("0.00");
  });
});

describe("findGroupSettlementDebt", () => {
  it("finds the pair in either order and keeps the stored direction", () => {
    const balances = buildBalances([buildDebt()]);

    expect(
      findGroupSettlementDebt(balances, "EUR", "debtor", "creditor"),
    ).toEqual(buildDebt());
    expect(
      findGroupSettlementDebt(balances, "EUR", "creditor", "debtor"),
    ).toEqual(buildDebt());
  });

  it("returns null without a matching currency, pair or balances", () => {
    const balances = buildBalances([buildDebt()]);

    expect(
      findGroupSettlementDebt(balances, "USD", "debtor", "creditor"),
    ).toBeNull();
    expect(
      findGroupSettlementDebt(balances, "EUR", "debtor", "other"),
    ).toBeNull();
    expect(findGroupSettlementDebt(null, "EUR", "debtor", "creditor")).toBeNull();
  });

  it("ignores blank or identical pair ids", () => {
    const balances = buildBalances([buildDebt()]);

    expect(findGroupSettlementDebt(balances, "", "debtor", "creditor")).toBeNull();
    expect(
      findGroupSettlementDebt(balances, "EUR", "debtor", "debtor"),
    ).toBeNull();
    expect(findGroupSettlementDebt(balances, "EUR", " ", "creditor")).toBeNull();
  });
});

describe("getGroupSettlementViewerDirection", () => {
  it("resolves who pays from the stored pair", () => {
    const debt = buildDebt();

    expect(getGroupSettlementViewerDirection("debtor", debt)).toBe(
      "viewer-pays",
    );
    expect(getGroupSettlementViewerDirection("creditor", debt)).toBe(
      "viewer-receives",
    );
    expect(getGroupSettlementViewerDirection("other", debt)).toBeNull();
    expect(getGroupSettlementViewerDirection("", debt)).toBeNull();
  });
});

describe("getGroupSettlementEditBoundCents", () => {
  it("adds the stored settlement back to the live pair debt", () => {
    expect(
      getGroupSettlementEditBoundCents(
        buildSettlement({ amountCents: 1000 }),
        buildDebt({ amountCents: 1500 }),
      ),
    ).toBe(2500);
  });

  it("falls back to the stored amount when the pair changed", () => {
    expect(
      getGroupSettlementEditBoundCents(buildSettlement(), null),
    ).toBe(1000);
    expect(
      getGroupSettlementEditBoundCents(
        buildSettlement(),
        buildDebt({ fromUserId: "creditor", toUserId: "debtor" }),
      ),
    ).toBe(1000);
    expect(
      getGroupSettlementEditBoundCents(
        buildSettlement(),
        buildDebt({ currency: "USD" }),
      ),
    ).toBe(1000);
  });
});

describe("getGroupSettlementAmountIssue", () => {
  it("requires a positive amount", () => {
    expect(
      getGroupSettlementAmountIssue(buildValues({ amount: " " }), 2500),
    ).toBe("AMOUNT_REQUIRED");
    expect(getGroupSettlementAmountIssue(buildValues({ amount: "abc" }), 2500)).toBe(
      "AMOUNT_INVALID",
    );
    expect(getGroupSettlementAmountIssue(buildValues({ amount: "0" }), 2500)).toBe(
      "AMOUNT_INVALID",
    );
  });

  it("compares the amount with the outstanding debt", () => {
    expect(
      getGroupSettlementAmountIssue(buildValues({ amount: "10,00" }), 2500),
    ).toBeNull();
    expect(
      getGroupSettlementAmountIssue(buildValues({ amount: "25,00" }), 2500),
    ).toBeNull();
    expect(
      getGroupSettlementAmountIssue(buildValues({ amount: "25,01" }), 2500),
    ).toBe("AMOUNT_EXCEEDS_DEBT");
  });
});

describe("getGroupSettlementDateIssue", () => {
  it("rejects unparseable and future dates", () => {
    expect(
      getGroupSettlementDateIssue(buildValues({ date: "31/02/2026" }), today),
    ).toBe("DATE_INVALID");
    expect(
      getGroupSettlementDateIssue(buildValues({ date: "2026-11-24" }), today),
    ).toBe("DATE_IN_FUTURE");
  });

  it("accepts today and past days", () => {
    expect(getGroupSettlementDateIssue(buildValues(), today)).toBeNull();
    expect(
      getGroupSettlementDateIssue(buildValues({ date: "2026-11-01" }), today),
    ).toBeNull();
  });
});

describe("createGroupSettlementFormValues", () => {
  it("prefills the canonical pair, the full debt and today", () => {
    expect(
      createGroupSettlementFormValues({
        viewerUid: "creditor",
        groupId: "group-1",
        debt: buildDebt({ fromUserId: "creditor", toUserId: "debtor" }),
        today,
      }),
    ).toEqual({
      viewerUid: "creditor",
      groupId: "group-1",
      currency: "EUR",
      fromUserId: "creditor",
      toUserId: "debtor",
      amount: "25.00",
      date: today,
      note: "",
      walletId: "",
      categoryId: "",
    });
  });
});

describe("createGroupSettlementEditFormValues", () => {
  it("restores the stored values and the creditor link", () => {
    expect(
      createGroupSettlementEditFormValues({
        settlement: buildSettlement({
          receiverWalletId: "wallet-1",
          receiverCategoryId: "category-1",
        }),
        viewerUid: "creditor",
        today,
      }),
    ).toMatchObject({
      groupId: "group-1",
      amount: "10.00",
      date: "2026-11-20",
      walletId: "wallet-1",
      categoryId: "category-1",
    });
  });

  it("hides the link from the debtor and falls back to today without a date", () => {
    expect(
      createGroupSettlementEditFormValues({
        settlement: buildSettlement({
          date: "",
          receiverWalletId: "wallet-1",
          receiverCategoryId: "category-1",
        }),
        viewerUid: "debtor",
        today,
      }),
    ).toMatchObject({
      date: today,
      walletId: "",
      categoryId: "",
    });
  });
});

describe("selectGroupSettlementWallet", () => {
  it("clears the category when the wallet is removed", () => {
    const values = buildValues({ walletId: "wallet-1", categoryId: "category-1" });

    expect(selectGroupSettlementWallet(values, "wallet-2").categoryId).toBe(
      "category-1",
    );
    expect(selectGroupSettlementWallet(values, " ")).toMatchObject({
      walletId: "",
      categoryId: "",
    });
  });
});

describe("toGroupSettlementInput", () => {
  it("keeps the creditor link and drops it for the debtor", () => {
    const values = buildValues({ walletId: "wallet-1", categoryId: "category-1" });

    expect(toGroupSettlementInput(values, true)).toMatchObject({
      walletId: "wallet-1",
      categoryId: "category-1",
      fromUserId: "debtor",
      toUserId: "creditor",
    });
    expect(toGroupSettlementInput(values, false)).toMatchObject({
      walletId: "",
      categoryId: "",
    });
  });

  it("never sends a category without a wallet", () => {
    const values = buildValues({ walletId: "", categoryId: "category-1" });

    expect(toGroupSettlementInput(values, true)).toMatchObject({
      walletId: "",
      categoryId: "",
    });
  });
});
