import { describe, expect, it } from "@jest/globals";

import type { ValidatedGroupExpense } from "../../types/group-expense.types";
import {
  assertGroupExpenseLinkCoherence,
  buildCreateGroupExpenseDto,
  buildUpdateGroupExpenseDto,
  isGroupExpenseLinked,
  resolveGroupExpenseLink,
} from "../group-expense-persist";
import { NOW, buildExpense } from "./group-expenses-service.fakes";

/** Viewer-paid value with an explicit link; override only the pair under test. */
function buildValue(
  overrides: Partial<ValidatedGroupExpense> = {},
): ValidatedGroupExpense {
  return {
    groupId: "user-a__group-1",
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

describe("assertGroupExpenseLinkCoherence", () => {
  it("accepts a viewer-paid expense with no link (toggle No)", () => {
    expect(() =>
      assertGroupExpenseLinkCoherence(
        buildValue({ walletId: null, categoryId: null }),
        "user-a",
      ),
    ).not.toThrow();
  });

  it("accepts a viewer-paid expense with a wallet and its category", () => {
    expect(() => assertGroupExpenseLinkCoherence(buildValue(), "user-a")).not
      .toThrow();
  });

  it("rejects a viewer-paid wallet without a category", () => {
    expect(() =>
      assertGroupExpenseLinkCoherence(buildValue({ categoryId: null }), "user-a"),
    ).toThrow(expect.objectContaining({ code: "CATEGORY_REQUIRED" }));
  });

  it("rejects a category without a wallet", () => {
    expect(() =>
      assertGroupExpenseLinkCoherence(buildValue({ walletId: null }), "user-a"),
    ).toThrow(expect.objectContaining({ code: "LINK_WITHOUT_REGISTRATION" }));
  });

  it("rejects a movement reference without the wallet that backs it", () => {
    expect(() =>
      assertGroupExpenseLinkCoherence(
        buildValue({
          walletId: null,
          categoryId: null,
          linkedTransactionId: "movement-1",
        }),
        "user-a",
      ),
    ).toThrow(expect.objectContaining({ code: "LINK_WITHOUT_REGISTRATION" }));
  });

  it("rejects a category without a wallet even when another member pays", () => {
    expect(() =>
      assertGroupExpenseLinkCoherence(
        buildValue({ payerId: "user-b", walletId: null }),
        "user-a",
      ),
    ).toThrow(expect.objectContaining({ code: "LINK_WITHOUT_REGISTRATION" }));
  });

  it("leaves another member's wallet for the service to drop", () => {
    expect(() =>
      assertGroupExpenseLinkCoherence(
        buildValue({ payerId: "user-b", categoryId: null }),
        "user-a",
      ),
    ).not.toThrow();
  });
});

describe("resolveGroupExpenseLink", () => {
  it("keeps the wallet and category when the viewer pays", () => {
    expect(resolveGroupExpenseLink(buildValue(), "user-a")).toEqual({
      walletId: "wallet-1",
      categoryId: "category-1",
    });
  });

  it("drops both ids when another member pays", () => {
    expect(
      resolveGroupExpenseLink(buildValue({ payerId: "user-b" }), "user-a"),
    ).toEqual({ walletId: null, categoryId: null });
  });
});

describe("isGroupExpenseLinked", () => {
  it("is true with a wallet or a movement reference", () => {
    expect(isGroupExpenseLinked(buildExpense())).toBe(false);
    expect(isGroupExpenseLinked(buildExpense({ walletId: "wallet-1" }))).toBe(
      true,
    );
    expect(
      isGroupExpenseLinked(buildExpense({ linkedTransactionId: "movement-1" })),
    ).toBe(true);
  });
});

describe("group expense DTO builders", () => {
  it("stamps the creator, the creation time and the link on create", () => {
    expect(buildCreateGroupExpenseDto(buildValue(), "user-a", NOW)).toEqual({
      groupId: "user-a__group-1",
      payerId: "user-a",
      amountCents: 1000,
      currency: "EUR",
      splitMode: "equal",
      participants: buildValue().participants,
      description: "Dinner",
      date: "2026-11-10",
      walletId: "wallet-1",
      categoryId: "category-1",
      linkedTransactionId: null,
      createdBy: "user-a",
      createdAt: NOW,
      updatedAt: NOW,
      deletedAt: null,
    });
  });

  it("only carries the mutable fields and leaves persistence the movement id", () => {
    const dto = buildUpdateGroupExpenseDto(buildValue(), NOW);

    expect(dto).toEqual({
      payerId: "user-a",
      amountCents: 1000,
      currency: "EUR",
      splitMode: "equal",
      participants: buildValue().participants,
      description: "Dinner",
      date: "2026-11-10",
      walletId: "wallet-1",
      categoryId: "category-1",
      updatedAt: NOW,
    });
    expect(dto).not.toHaveProperty("linkedTransactionId");
  });
});
