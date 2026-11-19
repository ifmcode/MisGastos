import { describe, expect, it } from "@jest/globals";

import { validateSharedExpenseInput } from "../shared-expense.schema";
import { buildInput, issuesOf, VIEWER } from "./shared-expense-input.test-helpers";

describe("validateSharedExpenseInput - payer wallet", () => {
  it("requires a wallet when the viewer pays and registers", () => {
    expect(issuesOf({ walletId: "", categoryId: "category-1" })).toEqual([
      { field: "walletId", code: "WALLET_REQUIRED" },
    ]);
    expect(issuesOf({ walletId: "   " })).toEqual([
      { field: "walletId", code: "WALLET_REQUIRED" },
    ]);
  });

  it("keeps a friend-paid expense social-only without a wallet", () => {
    const result = validateSharedExpenseInput(
      buildInput({ payerId: "user-b", walletId: "" }),
      VIEWER,
    );

    expect(result.ok && result.value).toMatchObject({
      payerId: "user-b",
      walletId: null,
      categoryId: null,
    });
  });

  it("keeps the wallet and category of a viewer-paid expense", () => {
    const result = validateSharedExpenseInput(
      buildInput({ walletId: "wallet-1", categoryId: "category-1" }),
      VIEWER,
    );

    expect(result.ok && result.value).toMatchObject({
      payerId: "user-a",
      walletId: "wallet-1",
      categoryId: "category-1",
    });
  });

  it("requires a category when the viewer pays with a wallet", () => {
    expect(issuesOf({ walletId: "wallet-1", categoryId: "" })).toEqual([
      { field: "categoryId", code: "CATEGORY_REQUIRED" },
    ]);
    expect(issuesOf({ walletId: "wallet-1", categoryId: "  " })).toEqual([
      { field: "categoryId", code: "CATEGORY_REQUIRED" },
    ]);
  });

  it("never asks for a category when registration has no wallet", () => {
    expect(issuesOf({ walletId: "", categoryId: "" })).toEqual([
      { field: "walletId", code: "WALLET_REQUIRED" },
    ]);
  });

  it("keeps the friend-paid social-only expense valid without a category", () => {
    const result = validateSharedExpenseInput(
      buildInput({ payerId: "user-b", walletId: "", categoryId: "" }),
      VIEWER,
    );

    expect(result.ok && result.value).toMatchObject({
      payerId: "user-b",
      walletId: null,
      categoryId: null,
    });
  });

  it("does not require a wallet before the payer is resolved", () => {
    expect(issuesOf({ payerId: "", walletId: "" })).toEqual([
      { field: "payerId", code: "PAYER_REQUIRED" },
    ]);
  });
});
