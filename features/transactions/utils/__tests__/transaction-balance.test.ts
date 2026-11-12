import { describe, expect, it } from "@jest/globals";

import {
  applyTransactionToBalance,
  applyTransactionUpdateToBalance,
  getSignedTransactionAmount,
  revertTransactionFromBalance,
} from "../transaction-balance";

describe("transaction balance helpers", () => {
  it("signs expenses and incomes", () => {
    expect(getSignedTransactionAmount({ type: "expense", amount: 10 })).toBe(
      -10,
    );
    expect(getSignedTransactionAmount({ type: "income", amount: 10 })).toBe(10);
  });

  it("applies and reverts a movement", () => {
    expect(
      applyTransactionToBalance(100, { type: "expense", amount: 25.5 }),
    ).toBe(74.5);
    expect(
      revertTransactionFromBalance(74.5, { type: "expense", amount: 25.5 }),
    ).toBe(100);
  });

  it("applies an edit by reverting the previous movement first", () => {
    expect(
      applyTransactionUpdateToBalance(
        74.5,
        { type: "expense", amount: 25.5 },
        { type: "income", amount: 10 },
      ),
    ).toBe(110);
  });

  it("rounds to two decimals", () => {
    expect(
      applyTransactionToBalance(0.1, { type: "income", amount: 0.2 }),
    ).toBe(0.3);
  });
});
