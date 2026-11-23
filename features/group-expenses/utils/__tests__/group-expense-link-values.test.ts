import { describe, expect, it } from "@jest/globals";

import {
  getGroupExpenseWalletCurrencyError,
  selectGroupExpenseCategory,
  selectGroupExpenseCurrency,
  selectGroupExpensePayer,
  selectGroupExpenseWallet,
  selectGroupExpenseWalletRegistration,
} from "../group-expense-link-values";
import {
  buildFormValues,
  buildWallet,
  VIEWER,
} from "./group-expense-ui.test-helpers";

describe("selectGroupExpensePayer", () => {
  it("drops the wallet link when another member pays", () => {
    const next = selectGroupExpensePayer(
      buildFormValues({
        payerId: VIEWER,
        walletId: "wallet-1",
        categoryId: "category-1",
      }),
      "user-b",
    );

    expect(next.payerId).toBe("user-b");
    expect(next.walletId).toBe("");
    expect(next.categoryId).toBe("");
  });

  it("keeps the link when the same payer is selected again", () => {
    const values = buildFormValues({
      payerId: VIEWER,
      walletId: "wallet-1",
      categoryId: "category-1",
    });

    expect(selectGroupExpensePayer(values, VIEWER)).toBe(values);
  });
});

describe("selectGroupExpenseWallet", () => {
  it("stores the wallet without inventing a category", () => {
    const next = selectGroupExpenseWallet(buildFormValues(), "wallet-1");

    expect(next.walletId).toBe("wallet-1");
    expect(next.categoryId).toBe("");
  });

  it("keeps a real category the user already picked", () => {
    const next = selectGroupExpenseWallet(
      buildFormValues({ categoryId: "category-1" }),
      "wallet-1",
    );

    expect(next.walletId).toBe("wallet-1");
    expect(next.categoryId).toBe("category-1");
  });

  it("clears the category when the wallet is removed", () => {
    const next = selectGroupExpenseWallet(
      buildFormValues({ walletId: "wallet-1", categoryId: "category-1" }),
      "",
    );

    expect(next.walletId).toBe("");
    expect(next.categoryId).toBe("");
  });
});

describe("selectGroupExpenseCategory", () => {
  it("stores the selected category", () => {
    expect(
      selectGroupExpenseCategory(buildFormValues(), "category-1").categoryId,
    ).toBe("category-1");
  });
});

describe("selectGroupExpenseWalletRegistration", () => {
  it("clears the wallet and category when registration is turned off", () => {
    const next = selectGroupExpenseWalletRegistration(
      buildFormValues({
        registerInWallet: true,
        walletId: "wallet-1",
        categoryId: "category-1",
      }),
      false,
    );

    expect(next.registerInWallet).toBe(false);
    expect(next.walletId).toBe("");
    expect(next.categoryId).toBe("");
  });

  it("keeps the current ids when registration is turned on", () => {
    const next = selectGroupExpenseWalletRegistration(
      buildFormValues({ walletId: "wallet-1", categoryId: "category-1" }),
      true,
    );

    expect(next.registerInWallet).toBe(true);
    expect(next.walletId).toBe("wallet-1");
    expect(next.categoryId).toBe("category-1");
  });
});

describe("selectGroupExpenseCurrency", () => {
  it("keeps the wallet when it already uses the new currency", () => {
    const next = selectGroupExpenseCurrency(
      buildFormValues({
        registerInWallet: true,
        walletId: "wallet-1",
        categoryId: "category-1",
      }),
      "EUR",
      [buildWallet({ id: "wallet-1", currency: "EUR" })],
    );

    expect(next.currency).toBe("EUR");
    expect(next.walletId).toBe("wallet-1");
    expect(next.categoryId).toBe("category-1");
    expect(next.registerInWallet).toBe(true);
  });

  it("clears the link and turns the toggle off on a new currency", () => {
    const next = selectGroupExpenseCurrency(
      buildFormValues({
        registerInWallet: true,
        walletId: "wallet-1",
        categoryId: "category-1",
      }),
      "USD",
      [buildWallet({ id: "wallet-1", currency: "EUR" })],
    );

    expect(next.currency).toBe("USD");
    expect(next.walletId).toBe("");
    expect(next.categoryId).toBe("");
    expect(next.registerInWallet).toBe(false);
  });

  it("only changes the currency when no wallet is selected", () => {
    const next = selectGroupExpenseCurrency(buildFormValues(), "USD", []);

    expect(next.currency).toBe("USD");
    expect(next.walletId).toBe("");
    expect(next.categoryId).toBe("");
  });
});

describe("getGroupExpenseWalletCurrencyError", () => {
  it("returns null when the wallet uses the expense currency", () => {
    expect(
      getGroupExpenseWalletCurrencyError(
        buildFormValues({ walletId: "wallet-1" }),
        [buildWallet({ id: "wallet-1", currency: "EUR" })],
      ),
    ).toBeNull();
  });

  it("returns CURRENCY_MISMATCH when the wallet uses another currency", () => {
    expect(
      getGroupExpenseWalletCurrencyError(
        buildFormValues({ walletId: "wallet-1" }),
        [buildWallet({ id: "wallet-1", currency: "USD" })],
      ),
    ).toBe("CURRENCY_MISMATCH");
  });

  it("returns null without a wallet or with an orphaned one", () => {
    expect(
      getGroupExpenseWalletCurrencyError(buildFormValues({ walletId: "  " }), [
        buildWallet({ id: "wallet-1", currency: "USD" }),
      ]),
    ).toBeNull();
    expect(
      getGroupExpenseWalletCurrencyError(
        buildFormValues({ walletId: "wallet-deleted" }),
        [buildWallet({ id: "wallet-1", currency: "USD" })],
      ),
    ).toBeNull();
  });
});
