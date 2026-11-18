import { describe, expect, it } from "@jest/globals";

import type { SettlementInput } from "../../types/settlement.types";
import {
  toSettlementFieldErrors,
  validateSettlementInput,
} from "../settlement.schema";

const baseInput: SettlementInput = {
  friendUid: " user-b ",
  currency: "EUR",
  amount: "12,50",
  date: "10/11/2026",
  note: "  Dinner  ",
};

function validate(overrides: Partial<SettlementInput> = {}) {
  return validateSettlementInput({ ...baseInput, ...overrides }, "user-a");
}

describe("validateSettlementInput - valid payloads", () => {
  it("normalizes friend, amount, date and note", () => {
    const result = validate({
      walletId: " wallet-1 ",
      categoryId: " category-1 ",
    });

    expect(result).toEqual({
      ok: true,
      value: {
        friendUid: "user-b",
        amountCents: 1250,
        currency: "EUR",
        date: "2026-11-10",
        note: "Dinner",
        walletId: "wallet-1",
        categoryId: "category-1",
      },
    });
  });

  it("accepts a social-only settlement without note", () => {
    const result = validate({ note: undefined, amount: "1000000" });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.note).toBe("");
      expect(result.value.walletId).toBeNull();
      expect(result.value.categoryId).toBeNull();
      expect(result.value.amountCents).toBe(100_000_000);
    }
  });

  it("drops a category sent without a wallet", () => {
    const result = validate({ walletId: "  ", categoryId: "category-1" });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.walletId).toBeNull();
      expect(result.value.categoryId).toBeNull();
    }
  });
});

describe("validateSettlementInput - invalid payloads", () => {
  it("requires an amount", () => {
    expect(validate({ amount: "  " })).toEqual({
      ok: false,
      error: [{ field: "amount", code: "AMOUNT_REQUIRED" }],
    });
  });

  it("rejects a malformed or zero amount", () => {
    expect(validate({ amount: "abc" })).toEqual({
      ok: false,
      error: [{ field: "amount", code: "AMOUNT_INVALID" }],
    });
    expect(validate({ amount: "0" })).toMatchObject({
      ok: false,
      error: [{ field: "amount", code: "AMOUNT_INVALID" }],
    });
  });

  it("rejects an amount above the maximum", () => {
    expect(validate({ amount: "1000000,01" })).toEqual({
      ok: false,
      error: [{ field: "amount", code: "AMOUNT_TOO_HIGH" }],
    });
  });

  it("rejects a future transfer date", () => {
    expect(validate({ date: "2999-12-31" })).toEqual({
      ok: false,
      error: [{ field: "date", code: "DATE_IN_FUTURE" }],
    });
  });

  it("rejects an unknown currency, an invalid date and a long note", () => {
    const result = validate({
      currency: "BTC",
      date: "2026-13-01",
      note: "x".repeat(501),
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.map((issue) => issue.code)).toEqual([
        "CURRENCY_INVALID",
        "DATE_INVALID",
        "NOTE_TOO_LONG",
      ]);
    }
  });

  it("rejects an empty or self friend", () => {
    expect(validate({ friendUid: "   " })).toMatchObject({
      ok: false,
      error: [{ field: "friendUid", code: "FRIEND_NOT_FOUND" }],
    });
    expect(validate({ friendUid: "user-a" })).toMatchObject({
      ok: false,
      error: [{ field: "friendUid", code: "FRIEND_NOT_FOUND" }],
    });
  });

  it("requires a category when a wallet is chosen", () => {
    expect(validate({ walletId: "wallet-1", categoryId: "   " })).toEqual({
      ok: false,
      error: [{ field: "categoryId", code: "CATEGORY_REQUIRED" }],
    });
  });
});

describe("toSettlementFieldErrors", () => {
  it("keeps the first issue of every field", () => {
    expect(
      toSettlementFieldErrors([
        { field: "amount", code: "AMOUNT_REQUIRED" },
        { field: "amount", code: "AMOUNT_INVALID" },
        { field: "date", code: "DATE_INVALID" },
      ]),
    ).toEqual({ amount: "AMOUNT_REQUIRED", date: "DATE_INVALID" });
  });
});
