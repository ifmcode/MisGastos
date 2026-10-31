import { describe, expect, it } from "@jest/globals";

import {
  applyTransferToBalances,
  hasSufficientBalance,
} from "../transfer-balance";

describe("hasSufficientBalance", () => {
  it("accepts exact and lower amounts", () => {
    expect(hasSufficientBalance(100, 100)).toBe(true);
    expect(hasSufficientBalance(100, 25.5)).toBe(true);
  });

  it("rejects amounts above the available balance", () => {
    expect(hasSufficientBalance(100, 100.01)).toBe(false);
    expect(hasSufficientBalance(-5, 1)).toBe(false);
  });
});

describe("applyTransferToBalances", () => {
  it("subtracts from the source and adds to the destination", () => {
    expect(applyTransferToBalances(100, 50, 30)).toEqual({
      fromBalance: 70,
      toBalance: 80,
    });
  });

  it("keeps the net global balance unchanged", () => {
    const result = applyTransferToBalances(100, 50, 30);

    expect(result.fromBalance + result.toBalance).toBe(150);
  });

  it("rounds decimals to avoid float drift", () => {
    expect(applyTransferToBalances(0.3, 0.1, 0.2)).toEqual({
      fromBalance: 0.1,
      toBalance: 0.3,
    });
  });
});
