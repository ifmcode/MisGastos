import { describe, expect, it } from "@jest/globals";

import { hasViewerPaidWithoutWallet } from "../shared-expense-wallet-warning";
import { buildSharedExpense } from "./shared-expense.fixtures";

const VIEWER = "user-a";
const FRIEND = "user-b";

describe("hasViewerPaidWithoutWallet", () => {
  it("returns true when the viewer paid and no wallet is linked", () => {
    const expense = buildSharedExpense({ payerId: VIEWER, walletId: null });

    expect(hasViewerPaidWithoutWallet(expense, VIEWER)).toBe(true);
  });

  it("returns false when the viewer paid with a wallet", () => {
    const expense = buildSharedExpense({ payerId: VIEWER, walletId: "wallet-1" });

    expect(hasViewerPaidWithoutWallet(expense, VIEWER)).toBe(false);
  });

  it("returns false when the friend paid without a wallet", () => {
    const expense = buildSharedExpense({ payerId: FRIEND, walletId: null });

    expect(hasViewerPaidWithoutWallet(expense, VIEWER)).toBe(false);
  });

  it("returns false when the friend paid with their wallet", () => {
    const expense = buildSharedExpense({
      payerId: FRIEND,
      walletId: "wallet-friend",
    });

    expect(hasViewerPaidWithoutWallet(expense, VIEWER)).toBe(false);
  });

  it("returns false when the wallet was permanently deleted", () => {
    const expense = buildSharedExpense({ payerId: VIEWER, walletId: "-1" });

    expect(hasViewerPaidWithoutWallet(expense, VIEWER)).toBe(false);
  });
});
