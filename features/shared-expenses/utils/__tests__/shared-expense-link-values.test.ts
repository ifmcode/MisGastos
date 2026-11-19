import { describe, expect, it } from "@jest/globals";

import type { Wallet } from "@/features/wallets/types/wallet.types";

import { getSharedExpenseCategoryId } from "../../services/shared-expense-category";
import {
  createSharedExpenseFormValues,
  type SharedExpenseFormValues,
} from "../shared-expense-form";
import {
  selectSharedExpenseCategory,
  selectSharedExpenseCurrency,
  selectSharedExpensePayer,
  selectSharedExpenseWallet,
  selectSharedExpenseWalletRegistration,
} from "../shared-expense-link-values";

function buildValues(
  overrides: Partial<SharedExpenseFormValues> = {},
): SharedExpenseFormValues {
  return {
    ...createSharedExpenseFormValues({
      viewerUid: "user-a",
      friendUid: "user-b",
      currency: "EUR",
      date: "2026-11-10",
    }),
    ...overrides,
  };
}

function buildWallet(overrides: Partial<Wallet> = {}): Wallet {
  return {
    id: "wallet-1",
    name: "Cuenta principal",
    currency: "EUR",
    icon: "bank-outline",
    color: "#0A7EA4",
    initialBalance: 0,
    balance: 100,
    type: "bank",
    includeInTotal: true,
    ownerId: "user-a",
    createdAt: "2026-11-01T10:00:00.000Z",
    updatedAt: "2026-11-01T10:00:00.000Z",
    ...overrides,
  };
}

describe("selectSharedExpensePayer", () => {
  it("drops the wallet link when the friend pays", () => {
    const values = buildValues({
      walletId: "wallet-1",
      categoryId: "category-1",
    });

    const next = selectSharedExpensePayer(values, "user-b");

    expect(next.payerId).toBe("user-b");
    expect(next.walletId).toBe("");
    expect(next.categoryId).toBe("");
  });

  it("keeps the link when the viewer stays the payer", () => {
    const values = buildValues({
      walletId: "wallet-1",
      categoryId: "category-1",
    });

    const next = selectSharedExpensePayer(values, "user-a");

    expect(next.walletId).toBe("wallet-1");
    expect(next.categoryId).toBe("category-1");
  });

  it("drops the friend's wallet when the viewer takes over as payer", () => {
    const values = buildValues({
      payerId: "user-b",
      walletId: "wallet-b",
      categoryId: "category-b",
    });

    const next = selectSharedExpensePayer(values, "user-a");

    expect(next.payerId).toBe("user-a");
    expect(next.walletId).toBe("");
    expect(next.categoryId).toBe("");
  });
});

describe("selectSharedExpenseWallet", () => {
  it("does not default the category when a wallet is selected", () => {
    const next = selectSharedExpenseWallet(buildValues(), "wallet-1");

    expect(next.walletId).toBe("wallet-1");
    expect(next.categoryId).toBe("");
  });

  it("keeps a real category the user already picked", () => {
    const next = selectSharedExpenseWallet(
      buildValues({ categoryId: "category-1" }),
      "wallet-1",
    );

    expect(next.categoryId).toBe("category-1");
  });

  it("clears a legacy shared category of the previous default", () => {
    const next = selectSharedExpenseWallet(
      buildValues({ categoryId: getSharedExpenseCategoryId("user-a") }),
      "wallet-1",
    );

    expect(next.walletId).toBe("wallet-1");
    expect(next.categoryId).toBe("");
  });

  it("clears the category when the wallet is removed", () => {
    const next = selectSharedExpenseWallet(
      buildValues({ walletId: "wallet-1", categoryId: "category-1" }),
      "",
    );

    expect(next.walletId).toBe("");
    expect(next.categoryId).toBe("");
  });
});

describe("selectSharedExpenseCategory", () => {
  it("stores the selected category", () => {
    expect(
      selectSharedExpenseCategory(buildValues(), "category-1").categoryId,
    ).toBe("category-1");
  });
});

describe("selectSharedExpenseWalletRegistration", () => {
  it("clears the wallet and category when registration is turned off", () => {
    const next = selectSharedExpenseWalletRegistration(
      buildValues({
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
    const next = selectSharedExpenseWalletRegistration(
      buildValues({ walletId: "wallet-1", categoryId: "category-1" }),
      true,
    );

    expect(next.registerInWallet).toBe(true);
    expect(next.walletId).toBe("wallet-1");
    expect(next.categoryId).toBe("category-1");
  });
});

describe("selectSharedExpenseCurrency", () => {
  it("keeps the wallet when it already uses the new currency", () => {
    const next = selectSharedExpenseCurrency(
      buildValues({ walletId: "wallet-1", categoryId: "category-1" }),
      "EUR",
      [buildWallet({ id: "wallet-1", currency: "EUR" })],
    );

    expect(next.currency).toBe("EUR");
    expect(next.walletId).toBe("wallet-1");
    expect(next.categoryId).toBe("category-1");
  });

  it("drops the link when the selected wallet uses another currency", () => {
    const next = selectSharedExpenseCurrency(
      buildValues({ walletId: "wallet-1", categoryId: "category-1" }),
      "USD",
      [buildWallet({ id: "wallet-1", currency: "EUR" })],
    );

    expect(next.currency).toBe("USD");
    expect(next.walletId).toBe("");
    expect(next.categoryId).toBe("");
  });

  it("only changes the currency when no wallet is selected", () => {
    const next = selectSharedExpenseCurrency(buildValues(), "USD", []);

    expect(next.currency).toBe("USD");
    expect(next.walletId).toBe("");
    expect(next.categoryId).toBe("");
  });
});
