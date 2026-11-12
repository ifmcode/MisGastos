import { describe, expect, it } from "@jest/globals";

import {
  assertBatchSize,
  getSignedAmount,
  readAmount,
  readBalance,
  readString,
} from "../wallet-delete.helpers";

describe("wallet delete helpers", () => {
  it("reads strings and falls back to empty", () => {
    expect(readString({ id: "wallet-1" }, "id")).toBe("wallet-1");
    expect(readString({ id: 42 }, "id")).toBe("");
    expect(readString({}, "id")).toBe("");
  });

  it("reads finite amounts and rounds them", () => {
    expect(readAmount(10.555)).toBe(10.56);
    expect(readAmount("10")).toBe(0);
    expect(readAmount(Number.NaN)).toBe(0);
  });

  it("reads the balance with the initial balance fallback", () => {
    expect(readBalance({ balance: 20.555 })).toBe(20.56);
    expect(readBalance({ initialBalance: 50 })).toBe(50);
    expect(readBalance({})).toBe(0);
  });

  it("signs incomes and expenses and ignores other types", () => {
    expect(getSignedAmount({ type: "income", amount: 10 })).toBe(10);
    expect(getSignedAmount({ type: "expense", amount: 10 })).toBe(-10);
    expect(getSignedAmount({ type: "transfer", amount: 10 })).toBe(0);
    expect(getSignedAmount({ type: "income", amount: "10" })).toBe(0);
  });

  it("rejects batches over the write limit", () => {
    expect(() => assertBatchSize(450)).not.toThrow();
    expect(() => assertBatchSize(451)).toThrow(
      expect.objectContaining({ code: "TOO_MANY_MOVEMENTS" }),
    );
  });
});
