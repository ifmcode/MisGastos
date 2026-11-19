import { describe, expect, it } from "@jest/globals";

import { validateSharedExpenseInput } from "../shared-expense.schema";
import { buildInput, issuesOf, VIEWER } from "./shared-expense-input.test-helpers";

describe("validateSharedExpenseInput - wallet registration toggle", () => {
  it("rejects registration without a wallet", () => {
    expect(
      issuesOf({ registerInWallet: true, walletId: "", categoryId: "" }),
    ).toEqual([{ field: "walletId", code: "WALLET_REQUIRED" }]);
    expect(
      issuesOf({ registerInWallet: true, walletId: "  ", categoryId: "" }),
    ).toEqual([{ field: "walletId", code: "WALLET_REQUIRED" }]);
  });

  it("rejects registration with a wallet but no category", () => {
    expect(
      issuesOf({ registerInWallet: true, walletId: "wallet-1", categoryId: "" }),
    ).toEqual([{ field: "categoryId", code: "CATEGORY_REQUIRED" }]);
  });

  it("keeps a registered viewer-paid expense linked", () => {
    const result = validateSharedExpenseInput(
      buildInput({
        registerInWallet: true,
        walletId: " wallet-1 ",
        categoryId: " category-1 ",
      }),
      VIEWER,
    );

    expect(result.ok && result.value).toMatchObject({
      walletId: "wallet-1",
      categoryId: "category-1",
      linkedTransactionId: null,
    });
  });

  it("rejects a wallet or category left over with the toggle off", () => {
    const expected = [{ field: "walletId", code: "LINK_WITHOUT_REGISTRATION" }];

    expect(issuesOf({ registerInWallet: false })).toEqual(expected);
    expect(
      issuesOf({
        registerInWallet: false,
        walletId: "wallet-1",
        categoryId: "category-1",
      }),
    ).toEqual(expected);
    expect(
      issuesOf({ registerInWallet: false, walletId: "", categoryId: "category-1" }),
    ).toEqual(expected);
  });

  it("accepts the toggle off without any link", () => {
    const result = validateSharedExpenseInput(
      buildInput({
        registerInWallet: false,
        walletId: "",
        categoryId: "",
      }),
      VIEWER,
    );

    expect(result.ok && result.value).toMatchObject({
      payerId: "user-a",
      walletId: null,
      categoryId: null,
      linkedTransactionId: null,
    });
  });

  it("keeps a friend-paid expense independent of the toggle", () => {
    const withoutIds = validateSharedExpenseInput(
      buildInput({
        payerId: "user-b",
        registerInWallet: false,
        walletId: "",
        categoryId: "",
      }),
      VIEWER,
    );

    expect(withoutIds.ok && withoutIds.value).toMatchObject({
      payerId: "user-b",
      walletId: null,
      categoryId: null,
    });

    const withIds = validateSharedExpenseInput(
      buildInput({
        payerId: "user-b",
        registerInWallet: false,
        walletId: "wallet-1",
        categoryId: "category-1",
      }),
      VIEWER,
    );

    expect(withIds.ok && withIds.value).toMatchObject({
      payerId: "user-b",
      walletId: "wallet-1",
      categoryId: "category-1",
    });
  });

  it("derives registration from the wallet when the toggle is absent", () => {
    const legacySocial = validateSharedExpenseInput(
      {
        ...buildInput({ walletId: "", categoryId: "" }),
        registerInWallet: undefined,
      },
      VIEWER,
    );

    expect(legacySocial.ok && legacySocial.value).toMatchObject({
      walletId: null,
      categoryId: null,
    });

    expect(
      issuesOf({
        registerInWallet: undefined,
        walletId: "wallet-1",
        categoryId: "",
      }),
    ).toEqual([{ field: "categoryId", code: "CATEGORY_REQUIRED" }]);
  });
});
