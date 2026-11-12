import { describe, expect, it } from "@jest/globals";

import { validateTransferInput } from "../transfer.schema";

const baseInput = {
  fromWalletId: "wallet-1",
  toWalletId: "wallet-2",
  amount: "10",
  currency: "EUR",
  notes: "Nota",
  date: "29/10/2026",
};

describe("transfer schema runtime guards", () => {
  it("rejects non-string wallet ids", () => {
    const result = validateTransferInput({
      ...baseInput,
      fromWalletId: 42,
      toWalletId: null,
    } as never);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.map((issue) => issue.code)).toEqual([
      "FROM_WALLET_REQUIRED",
      "TO_WALLET_REQUIRED",
    ]);
  });

  it("accepts missing or null notes", () => {
    for (const notes of [null, undefined]) {
      const result = validateTransferInput({ ...baseInput, notes });

      expect(result.ok).toBe(true);
      if (!result.ok) continue;
      expect("notes" in result.value).toBe(false);
    }
  });
});
