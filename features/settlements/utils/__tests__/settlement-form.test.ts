import { describe, expect, it } from "@jest/globals";

import type { FriendBalance } from "@/features/friends/types/friend.types";

import {
  createSettlementEditFormValues,
  createSettlementFormValues,
  formatSettlementAmountInput,
  getCreateDirection,
  getSettlementAmountIssue,
  getSettlementCurrencyOptions,
  getSettlementEditableNetCents,
  getSettlementFormDirection,
  getSettlementDateIssue,
  selectSettlementCurrency,
  selectSettlementMode,
  selectSettlementWallet,
  toSettlementInput,
  viewerIsCreditorFor,
} from "../settlement-form";
import { buildSettlement } from "./settlement.fixtures";

const balances: FriendBalance[] = [
  { currency: "EUR", netBalanceCents: -1250 },
  { currency: "USD", netBalanceCents: 400 },
];

const today = "2026-11-17";

describe("settlement form currency options", () => {
  it("keeps only currencies with a real debt and exposes the direction", () => {
    const options = getSettlementCurrencyOptions([
      ...balances,
      { currency: "GBP", netBalanceCents: 0 },
    ]);

    expect(options).toEqual([
      {
        currency: "EUR",
        netBalanceCents: -1250,
        debtCents: 1250,
        direction: "viewer-owes-friend",
      },
      {
        currency: "USD",
        netBalanceCents: 400,
        debtCents: 400,
        direction: "friend-owes-viewer",
      },
    ]);
    expect(viewerIsCreditorFor(options[0])).toBe(false);
    expect(viewerIsCreditorFor(options[1])).toBe(true);
  });

  it("formats cents as an input value with two decimals", () => {
    expect(formatSettlementAmountInput(1250)).toBe("12.50");
    expect(formatSettlementAmountInput(0)).toBe("0.00");
  });
});

describe("createSettlementFormValues", () => {
  it("defaults to the first debt currency, total mode and today", () => {
    const values = createSettlementFormValues({
      viewerUid: "user-a",
      friendUid: "user-b",
      balances,
      today,
    });

    expect(values).toMatchObject({
      currency: "EUR",
      mode: "total",
      amount: "12.50",
      date: today,
      dateText: "17/11/2026",
      walletId: "",
      categoryId: "",
    });
  });

  it("returns null when every currency is settled", () => {
    expect(
      createSettlementFormValues({
        viewerUid: "user-a",
        friendUid: "user-b",
        balances: [],
        today,
      }),
    ).toBeNull();
  });
});

describe("currency and mode changes", () => {
  it("selecting a currency resets the wallet and restores the total", () => {
    const initial = createSettlementFormValues({
      viewerUid: "user-a",
      friendUid: "user-b",
      balances,
      today,
    })!;

    const next = selectSettlementCurrency(initial, "USD", [
      ...getSettlementCurrencyOptions(balances),
    ]);

    expect(next).toMatchObject({
      currency: "USD",
      amount: "4.00",
      walletId: "",
      categoryId: "",
    });
  });

  it("partial mode keeps the typed amount and total mode overwrites it", () => {
    const initial = createSettlementFormValues({
      viewerUid: "user-a",
      friendUid: "user-b",
      balances,
      today,
    })!;
    const partial = selectSettlementMode(initial, "partial", 1250);

    expect(partial.amount).toBe("12.50");
    expect(selectSettlementMode(partial, "total", 400).amount).toBe("4.00");
  });

  it("selecting a wallet fills the default category and clearing it removes both", () => {
    const initial = createSettlementFormValues({
      viewerUid: "user-a",
      friendUid: "user-b",
      balances,
      today,
    })!;
    const withWallet = selectSettlementWallet(initial, "wallet-1", "category-1");

    expect(withWallet).toMatchObject({
      walletId: "wallet-1",
      categoryId: "category-1",
    });
    expect(selectSettlementWallet(withWallet, "", "category-1")).toMatchObject({
      walletId: "",
      categoryId: "",
    });
  });
});

describe("amount issue", () => {
  const values = {
    ...createSettlementFormValues({
      viewerUid: "user-a",
      friendUid: "user-b",
      balances,
      today,
    })!,
    mode: "partial" as const,
  };

  it("accepts the exact debt and rejects zero, malformed and above the debt", () => {
    expect(getSettlementAmountIssue({ ...values, amount: "12.50" }, 1250)).toBeNull();
    expect(getSettlementAmountIssue({ ...values, amount: "" }, 1250)).toBe(
      "AMOUNT_REQUIRED",
    );
    expect(getSettlementAmountIssue({ ...values, amount: "abc" }, 1250)).toBe(
      "AMOUNT_INVALID",
    );
    expect(getSettlementAmountIssue({ ...values, amount: "12.51" }, 1250)).toBe(
      "AMOUNT_EXCEEDS_DEBT",
    );
    expect(
      getSettlementAmountIssue({ ...values, mode: "total", amount: "0" }, 1250),
    ).toBeNull();
  });
});

describe("date issue", () => {
  const values = createSettlementFormValues({
    viewerUid: "user-a",
    friendUid: "user-b",
    balances,
    today,
  })!;

  it("accepts today and past dates", () => {
    expect(
      getSettlementDateIssue(
        { ...values, date: "2026-11-16", dateText: "16/11/2026" },
        today,
      ),
    ).toBeNull();
    expect(
      getSettlementDateIssue(
        { ...values, date: "2026-11-17", dateText: "17/11/2026" },
        today,
      ),
    ).toBeNull();
  });

  it("rejects future and unparseable dates", () => {
    expect(
      getSettlementDateIssue(
        { ...values, date: "2026-11-18", dateText: "18/11/2026" },
        today,
      ),
    ).toBe("DATE_IN_FUTURE");
    expect(
      getSettlementDateIssue(
        { ...values, date: "", dateText: "not-a-date" },
        today,
      ),
    ).toBe("DATE_INVALID");
  });
});

describe("edit values", () => {
  it("adds the settlement back to the current net to bound the new amount", () => {
    const paid = buildSettlement({ amountCents: 200, fromUserId: "user-a" });
    const received = buildSettlement({
      amountCents: 200,
      fromUserId: "user-b",
      toUserId: "user-a",
    });

    expect(getSettlementEditableNetCents(paid, "user-a", -1250)).toBe(-1450);
    expect(getSettlementEditableNetCents(received, "user-a", 1250)).toBe(1450);
  });

  it("preselects the creditor link and the partial mode when the settlement is partial", () => {
    const settlement = buildSettlement({
      amountCents: 500,
      receiverWalletId: "wallet-1",
      receiverCategoryId: "category-1",
      receiverTransactionId: "movement-1",
      toUserId: "user-a",
      fromUserId: "user-b",
    });

    const values = createSettlementEditFormValues({
      settlement,
      viewerUid: "user-a",
      currentNetCents: 500,
      today,
    });

    expect(values).toMatchObject({
      currency: "EUR",
      mode: "partial",
      amount: "5.00",
      walletId: "wallet-1",
      categoryId: "category-1",
    });
  });

  it("hides the link from the debtor", () => {
    const settlement = buildSettlement({
      receiverWalletId: "wallet-1",
      receiverCategoryId: "category-1",
      receiverTransactionId: "movement-1",
    });

    const values = createSettlementEditFormValues({
      settlement,
      viewerUid: "user-a",
      currentNetCents: 0,
      today,
    });

    expect(values.walletId).toBe("");
    expect(values.categoryId).toBe("");
  });
});

describe("direction and payload", () => {
  it("derives the create direction from the signed net", () => {
    const values = createSettlementFormValues({
      viewerUid: "user-a",
      friendUid: "user-b",
      balances,
      today,
    })!;
    const direction = getCreateDirection({
      values,
      viewerUid: "user-a",
      balances,
    });

    expect(direction).toEqual({
      fromUserId: "user-a",
      toUserId: "user-b",
      viewerIsCreditor: false,
    });
    expect(
      getSettlementFormDirection({
        values,
        options: getSettlementCurrencyOptions(balances),
      }),
    ).toBe("viewer-owes-friend");
  });

  it("keeps the stored direction when editing", () => {
    const values = createSettlementFormValues({
      viewerUid: "user-a",
      friendUid: "user-b",
      balances,
      today,
    })!;

    expect(
      getSettlementFormDirection({
        values,
        options: [],
        settlement: buildSettlement({ fromUserId: "user-b", toUserId: "user-a" }),
      }),
    ).toBe("friend-owes-viewer");
  });

  it("only sends wallet and category when the viewer is the creditor", () => {
    const values = {
      ...createSettlementFormValues({
        viewerUid: "user-a",
        friendUid: "user-b",
        balances,
        today,
      })!,
      walletId: "wallet-1",
      categoryId: "category-1",
      note: "  Dinner  ",
    };

    expect(toSettlementInput(values, true)).toMatchObject({
      walletId: "wallet-1",
      categoryId: "category-1",
      note: "  Dinner  ",
    });
    expect(toSettlementInput(values, false)).toMatchObject({
      walletId: "",
      categoryId: "",
    });
  });
});
