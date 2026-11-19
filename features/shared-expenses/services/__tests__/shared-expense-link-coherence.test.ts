import { describe, expect, it } from "@jest/globals";

import type { ValidatedSharedExpense } from "../../types/shared-expense.types";
import { assertSharedExpenseLinkCoherence } from "../shared-expense-persist";

/** Viewer-paid value with an explicit link; override only the pair under test. */
function buildValue(
  overrides: Partial<ValidatedSharedExpense> = {},
): ValidatedSharedExpense {
  return {
    participantIds: ["user-a", "user-b"],
    payerId: "user-a",
    amountCents: 1000,
    currency: "EUR",
    splitMode: "equal",
    participants: [
      { userId: "user-a", shareCents: 500 },
      { userId: "user-b", shareCents: 500 },
    ],
    description: "Dinner",
    date: "2026-11-10",
    walletId: "wallet-1",
    categoryId: "category-1",
    linkedTransactionId: null,
    ...overrides,
  };
}

describe("assertSharedExpenseLinkCoherence", () => {
  it("accepts a viewer-paid expense with no link (toggle No)", () => {
    expect(() =>
      assertSharedExpenseLinkCoherence(
        buildValue({ walletId: null, categoryId: null }),
        "user-a",
      ),
    ).not.toThrow();
  });

  it("accepts a viewer-paid expense with a wallet and its category", () => {
    expect(() => assertSharedExpenseLinkCoherence(buildValue(), "user-a")).not
      .toThrow();
  });

  it("rejects a viewer-paid wallet without a category", () => {
    expect(() =>
      assertSharedExpenseLinkCoherence(
        buildValue({ categoryId: null }),
        "user-a",
      ),
    ).toThrow(expect.objectContaining({ code: "CATEGORY_REQUIRED" }));
  });

  it("rejects a viewer-paid category without a wallet", () => {
    expect(() =>
      assertSharedExpenseLinkCoherence(
        buildValue({ walletId: null }),
        "user-a",
      ),
    ).toThrow(
      expect.objectContaining({ code: "LINK_WITHOUT_REGISTRATION" }),
    );
  });

  it("rejects a movement reference without the wallet that backs it", () => {
    expect(() =>
      assertSharedExpenseLinkCoherence(
        buildValue({
          walletId: null,
          categoryId: null,
          linkedTransactionId: "movement-1",
        }),
        "user-a",
      ),
    ).toThrow(
      expect.objectContaining({ code: "LINK_WITHOUT_REGISTRATION" }),
    );
  });

  it("rejects a category without a wallet even when a friend pays", () => {
    expect(() =>
      assertSharedExpenseLinkCoherence(
        buildValue({ payerId: "user-b", walletId: null }),
        "user-a",
      ),
    ).toThrow(
      expect.objectContaining({ code: "LINK_WITHOUT_REGISTRATION" }),
    );
  });

  it("leaves a friend-paid wallet for the repository to drop", () => {
    for (const overrides of [
      { walletId: "wallet-1", categoryId: null },
      { walletId: "wallet-1", categoryId: "category-1" },
    ]) {
      expect(() =>
        assertSharedExpenseLinkCoherence(
          buildValue({ ...overrides, payerId: "user-b" }),
          "user-a",
        ),
      ).not.toThrow();
    }
  });
});
