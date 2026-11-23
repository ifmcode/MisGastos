import { describe, expect, it } from "@jest/globals";

import { validateGroupExpenseInput } from "../group-expense.schema";
import {
  MEMBERS,
  VIEWER,
  buildInput,
} from "./group-expense-input.test-helpers";

function validate(overrides: Parameters<typeof buildInput>[0] = {}) {
  const result = validateGroupExpenseInput(
    buildInput(overrides),
    VIEWER,
    MEMBERS,
  );

  if (!result.ok) throw new Error(JSON.stringify(result.error));
  return result.value;
}

function issuesOf(overrides: Parameters<typeof buildInput>[0] = {}) {
  const result = validateGroupExpenseInput(
    buildInput(overrides),
    VIEWER,
    MEMBERS,
  );

  return result.ok ? "ok" : result.error;
}

describe("validateGroupExpenseInput wallet link", () => {
  it("stays social-only when the toggle is off and no id is sent", () => {
    const value = validate({
      registerInWallet: false,
      walletId: "",
      categoryId: "",
    });

    expect(value.walletId).toBeNull();
    expect(value.categoryId).toBeNull();
    expect(value.linkedTransactionId).toBeNull();
  });

  it("links the wallet and its category when the toggle is on", () => {
    const value = validate({
      registerInWallet: true,
      walletId: "  wallet-1  ",
      categoryId: "  category-1  ",
    });

    expect(value.walletId).toBe("wallet-1");
    expect(value.categoryId).toBe("category-1");
  });

  it("implicitly registers when the caller does not send the toggle", () => {
    const value = validate({ walletId: "wallet-1", categoryId: "category-1" });

    expect(value.walletId).toBe("wallet-1");
  });

  it("rejects leftover ids when the toggle says No", () => {
    expect(issuesOf({ registerInWallet: false, walletId: "wallet-1" })).toEqual([
      { field: "walletId", code: "LINK_WITHOUT_REGISTRATION" },
    ]);
    expect(
      issuesOf({ registerInWallet: false, categoryId: "category-1" }),
    ).toEqual([{ field: "walletId", code: "LINK_WITHOUT_REGISTRATION" }]);
  });

  it("requires a wallet when registering", () => {
    expect(issuesOf({ registerInWallet: true, walletId: "" })).toEqual([
      { field: "walletId", code: "WALLET_REQUIRED" },
    ]);
  });

  it("requires an explicit category when registering", () => {
    expect(
      issuesOf({
        registerInWallet: true,
        walletId: "wallet-1",
        categoryId: "  ",
      }),
    ).toEqual([{ field: "categoryId", code: "CATEGORY_REQUIRED" }]);
  });

  it("keeps the ids of another payer for the service to drop", () => {
    const value = validate({
      payerId: "user-b",
      registerInWallet: false,
      walletId: "wallet-1",
      categoryId: "category-1",
    });

    expect(value.payerId).toBe("user-b");
    expect(value.walletId).toBe("wallet-1");
    expect(value.categoryId).toBe("category-1");
  });

  it("reports nobody's missing category while another member pays", () => {
    const value = validate({
      payerId: "user-b",
      registerInWallet: true,
      walletId: "wallet-1",
    });

    expect(value.walletId).toBe("wallet-1");
    expect(value.categoryId).toBeNull();
  });
});
