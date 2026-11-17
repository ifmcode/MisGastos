import { describe, expect, it } from "@jest/globals";

import type { Category } from "@/features/categories/types/category.types";
import type { Wallet } from "@/features/wallets/types/wallet.types";

import { getSharedExpenseCategoryId } from "../../services/shared-expense-category";
import {
  getSharedExpenseCategoryChips,
  getSharedExpenseCategoryLabel,
  getSharedExpenseCategoryOptions,
  getSharedExpenseWalletOptions,
  SHARED_EXPENSE_CATEGORY_FALLBACK_KEY,
} from "../shared-expense-link-options";

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

function buildCategory(overrides: Partial<Category> = {}): Category {
  return {
    id: "category-1",
    name: "Comida",
    icon: "fast-food-outline",
    color: "#EF6C00",
    type: "expense",
    ownerId: "user-a",
    createdAt: "2026-11-01T10:00:00.000Z",
    updatedAt: "2026-11-01T10:00:00.000Z",
    ...overrides,
  };
}

const translate = (key: string) => `t:${key}`;

describe("getSharedExpenseWalletOptions", () => {
  it("keeps only active wallets of the expense currency", () => {
    const wallets = [
      buildWallet({ id: "eur-active" }),
      buildWallet({ id: "usd-active", currency: "USD" }),
      buildWallet({ id: "eur-archived", archivedAt: "2026-11-02T10:00:00Z" }),
    ];

    expect(
      getSharedExpenseWalletOptions(wallets, "EUR").map((wallet) => wallet.id),
    ).toEqual(["eur-active"]);
  });

  it("keeps a stored wallet as the visible exception when it was archived", () => {
    const wallets = [
      buildWallet({ id: "eur-active" }),
      buildWallet({
        id: "eur-archived",
        archivedAt: "2026-11-02T10:00:00Z",
        name: "Antigua",
      }),
    ];

    const options = getSharedExpenseWalletOptions(wallets, "EUR", "eur-archived");

    expect(options.map((wallet) => wallet.id)).toEqual([
      "eur-archived",
      "eur-active",
    ]);
    expect(options[0].name).toBe("Antigua");
  });

  it("never repeats the selected wallet when it already matched", () => {
    const wallets = [buildWallet({ id: "wallet-1" }), buildWallet({ id: "wallet-2" })];

    expect(
      getSharedExpenseWalletOptions(wallets, "EUR", "wallet-1").map(
        (wallet) => wallet.id,
      ),
    ).toEqual(["wallet-1", "wallet-2"]);
  });

  it("returns an empty list when no active wallet matches the currency", () => {
    expect(
      getSharedExpenseWalletOptions(
        [buildWallet({ id: "usd", currency: "USD" })],
        "EUR",
      ),
    ).toEqual([]);
  });
});

describe("getSharedExpenseCategoryOptions", () => {
  it("excludes a stored shared category and keeps the expense order", () => {
    const sharedId = getSharedExpenseCategoryId("user-a");
    const options = getSharedExpenseCategoryOptions(
      [
        buildCategory({ id: sharedId, name: "Gastos compartidos" }),
        buildCategory(),
        buildCategory({ id: "category-2", name: "Ocio" }),
      ],
      "user-a",
    );

    expect(options.map((option) => option.id)).toEqual([
      "category-1",
      "category-2",
    ]);
    expect(
      options.some((option) => option.id === getSharedExpenseCategoryId("user-a")),
    ).toBe(false);
  });

  it("adds no synthetic shared option while the document is missing", () => {
    const sharedId = getSharedExpenseCategoryId("user-a");
    const options = getSharedExpenseCategoryOptions([buildCategory()], "user-a");

    expect(options.map((option) => option.id)).toEqual(["category-1"]);
    expect(options.some((option) => option.id === sharedId)).toBe(false);
    expect(options.every((option) => option.labelKey === undefined)).toBe(true);
  });

  it("drops income categories", () => {
    const options = getSharedExpenseCategoryOptions(
      [buildCategory({ id: "income", type: "income", name: "Salario" })],
      "user-a",
    );

    expect(options.some((option) => option.id === "income")).toBe(false);
  });

  it("keeps an unknown selected id visible with the fallback label", () => {
    const options = getSharedExpenseCategoryOptions(
      [buildCategory()],
      "user-a",
      "deleted-category",
    );
    const fallback = options[options.length - 1];

    expect(fallback.id).toBe("deleted-category");
    expect(fallback.labelKey).toBe(SHARED_EXPENSE_CATEGORY_FALLBACK_KEY);
  });

  it("never restores the shared category as a selected fallback", () => {
    const sharedId = getSharedExpenseCategoryId("user-a");
    const options = getSharedExpenseCategoryOptions(
      [buildCategory()],
      "user-a",
      sharedId,
    );

    expect(options.map((option) => option.id)).toEqual(["category-1"]);
    expect(options.some((option) => option.id === sharedId)).toBe(false);
  });

  it("returns only the real categories without a viewer uid", () => {
    const options = getSharedExpenseCategoryOptions([buildCategory()], "");

    expect(options.map((option) => option.id)).toEqual(["category-1"]);
  });
});

describe("getSharedExpenseCategoryChips", () => {
  it("leads with the selected option and respects the limit", () => {
    const options = [
      { id: "a", label: "A", icon: "receipt-outline" as const },
      { id: "b", label: "B", icon: "receipt-outline" as const },
      { id: "c", label: "C", icon: "receipt-outline" as const },
      { id: "d", label: "D", icon: "receipt-outline" as const },
    ];

    expect(
      getSharedExpenseCategoryChips(options, "d").map((option) => option.id),
    ).toEqual(["d", "a", "b"]);
  });

  it("handles an empty selection", () => {
    const options = [{ id: "a", label: "A", icon: "receipt-outline" as const }];

    expect(getSharedExpenseCategoryChips(options, "", 0)).toEqual([]);
  });
});

describe("getSharedExpenseCategoryLabel", () => {
  it("translates synthetic options and keeps stored names", () => {
    expect(
      getSharedExpenseCategoryLabel(
        { id: "x", label: "", labelKey: "form.categoryUnavailable", icon: "receipt-outline" },
        translate,
      ),
    ).toBe("t:form.categoryUnavailable");
    expect(
      getSharedExpenseCategoryLabel(
        { id: "y", label: "Comida", icon: "fast-food-outline" },
        translate,
      ),
    ).toBe("Comida");
  });
});
