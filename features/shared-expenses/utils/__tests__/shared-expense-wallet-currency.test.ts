import { describe, expect, it } from "@jest/globals";

import { getSharedExpenseWalletCurrencyError } from "../shared-expense-link-values";
import {
  buildLinkFormValues,
  buildLinkWallet,
} from "./shared-expense-link.fixtures";

describe("getSharedExpenseWalletCurrencyError", () => {
  it("returns null when the wallet uses the expense currency", () => {
    expect(
      getSharedExpenseWalletCurrencyError(
        buildLinkFormValues({ walletId: "wallet-1" }),
        [buildLinkWallet({ id: "wallet-1", currency: "EUR" })],
      ),
    ).toBeNull();
  });

  it("returns CURRENCY_MISMATCH when the wallet uses another currency", () => {
    expect(
      getSharedExpenseWalletCurrencyError(
        buildLinkFormValues({ walletId: "wallet-1" }),
        [buildLinkWallet({ id: "wallet-1", currency: "USD" })],
      ),
    ).toBe("CURRENCY_MISMATCH");
  });

  it("returns null without a selected wallet", () => {
    expect(
      getSharedExpenseWalletCurrencyError(
        buildLinkFormValues({ walletId: "  " }),
        [buildLinkWallet({ id: "wallet-1", currency: "USD" })],
      ),
    ).toBeNull();
  });

  it("returns null for an orphaned wallet the list does not hold", () => {
    expect(
      getSharedExpenseWalletCurrencyError(
        buildLinkFormValues({ walletId: "wallet-deleted" }),
        [buildLinkWallet({ id: "wallet-1", currency: "USD" })],
      ),
    ).toBeNull();
  });
});
