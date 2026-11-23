import { describe, expect, it } from "@jest/globals";

import type { GroupSettlementInput } from "../../types/group-settlement.types";
import {
  toGroupSettlementFieldErrors,
  validateGroupSettlementInput,
} from "../group-settlement.schema";

const TODAY = "2026-11-20";

function buildInput(
  overrides: Partial<GroupSettlementInput> = {},
): GroupSettlementInput {
  return {
    groupId: "user-a__group-1",
    fromUserId: "user-b",
    toUserId: "user-c",
    amount: "10.50",
    currency: "EUR",
    date: "2026-11-10",
    note: "Dinner",
    ...overrides,
  };
}

function codes(input: GroupSettlementInput) {
  const result = validateGroupSettlementInput(input, TODAY);

  return result.ok ? [] : result.error.map((issue) => issue.code);
}

describe("validateGroupSettlementInput", () => {
  it("normalizes a social-only settlement", () => {
    expect(
      validateGroupSettlementInput(buildInput({ note: "  Dinner  " }), TODAY),
    ).toEqual({
      ok: true,
      value: {
        groupId: "user-a__group-1",
        fromUserId: "user-b",
        toUserId: "user-c",
        amountCents: 1050,
        currency: "EUR",
        date: "2026-11-10",
        note: "Dinner",
        walletId: null,
        categoryId: null,
      },
    });
  });

  it("keeps a complete creditor link and drops a category without wallet", () => {
    const linked = validateGroupSettlementInput(
      buildInput({ walletId: " wallet-1 ", categoryId: " category-1 " }),
      TODAY,
    );
    const orphanCategory = validateGroupSettlementInput(
      buildInput({ categoryId: "category-1" }),
      TODAY,
    );

    expect(linked.ok && linked.value).toMatchObject({
      walletId: "wallet-1",
      categoryId: "category-1",
    });
    expect(orphanCategory.ok && orphanCategory.value).toMatchObject({
      walletId: null,
      categoryId: null,
    });
  });

  it("accepts today as a valid date", () => {
    expect(codes(buildInput({ date: TODAY }))).toEqual([]);
  });

  it("reports every shape error with its field", () => {
    const result = validateGroupSettlementInput(
      buildInput({
        groupId: " ",
        fromUserId: "",
        toUserId: "",
        amount: "",
        currency: "BIT",
        date: "",
        note: "x".repeat(501),
      }),
      TODAY,
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;

    expect(result.error).toEqual([
      { field: "groupId", code: "GROUP_REQUIRED" },
      { field: "fromUserId", code: "FROM_REQUIRED" },
      { field: "toUserId", code: "TO_REQUIRED" },
      { field: "amount", code: "AMOUNT_REQUIRED" },
      { field: "currency", code: "CURRENCY_INVALID" },
      { field: "date", code: "DATE_INVALID" },
      { field: "note", code: "NOTE_TOO_LONG" },
    ]);
  });

  it("rejects the same member on both sides", () => {
    expect(codes(buildInput({ toUserId: "user-b" }))).toEqual(["PAIR_SAME"]);
  });

  it("rejects a malformed, zero or excessive amount", () => {
    expect(codes(buildInput({ amount: "abc" }))).toEqual(["AMOUNT_INVALID"]);
    expect(codes(buildInput({ amount: "0" }))).toEqual(["AMOUNT_INVALID"]);
    expect(codes(buildInput({ amount: "1000000.01" }))).toEqual([
      "AMOUNT_TOO_HIGH",
    ]);
    expect(codes(buildInput({ amount: "999999.99" }))).toEqual([]);
  });

  it("rejects a future date", () => {
    expect(codes(buildInput({ date: "2026-11-21" }))).toEqual([
      "DATE_IN_FUTURE",
    ]);
  });

  it("requires a category whenever a wallet is linked", () => {
    expect(codes(buildInput({ walletId: "wallet-1" }))).toEqual([
      "CATEGORY_REQUIRED",
    ]);
  });

  it("accepts a comma decimal separator", () => {
    const result = validateGroupSettlementInput(
      buildInput({ amount: "10,50" }),
      TODAY,
    );

    expect(result.ok && result.value.amountCents).toBe(1050);
  });
});

describe("toGroupSettlementFieldErrors", () => {
  it("keeps the first code per field", () => {
    expect(
      toGroupSettlementFieldErrors([
        { field: "amount", code: "AMOUNT_INVALID" },
        { field: "amount", code: "AMOUNT_TOO_HIGH" },
        { field: "date", code: "DATE_INVALID" },
      ]),
    ).toEqual({ amount: "AMOUNT_INVALID", date: "DATE_INVALID" });
  });
});
