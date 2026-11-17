import { describe, expect, it } from "@jest/globals";

import { FakeFriendsRepository } from "@/features/friends/services/__tests__/friends-service.fakes";

import { buildSharedExpense } from "../../utils/__tests__/shared-expense.fixtures";
import type { ValidatedSharedExpense } from "../../types/shared-expense.types";
import {
  assertExpenseParticipant,
  assertSameExpensePair,
  requireSharedExpense,
  requireSharedExpenseViewer,
} from "../shared-expenses.guards";
import {
  assertSharedExpenseFriendship,
  assertSharedExpensePayerWallet,
} from "../shared-expense-persist";
import { FakeSharedExpensesRepository } from "./shared-expenses-service.fakes";

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
    categoryId: null,
    linkedTransactionId: null,
    ...overrides,
  };
}

describe("requireSharedExpenseViewer", () => {
  it("trims the viewer and rejects anything that is not a uid", () => {
    expect(requireSharedExpenseViewer(" user-a ")).toBe("user-a");
    expect(() => requireSharedExpenseViewer(undefined)).toThrow(
      expect.objectContaining({ code: "SIGN_IN_REQUIRED" }),
    );
    expect(() => requireSharedExpenseViewer("")).toThrow(
      expect.objectContaining({ code: "SIGN_IN_REQUIRED" }),
    );
  });
});

describe("requireSharedExpense", () => {
  it("rejects a blank id without querying Firestore", async () => {
    const repository = new FakeSharedExpensesRepository();

    await expect(requireSharedExpense(repository, "  ")).rejects.toMatchObject({
      code: "EXPENSE_NOT_FOUND",
    });
  });

  it("returns the stored expense", async () => {
    const repository = new FakeSharedExpensesRepository();
    repository.seed(buildSharedExpense());

    await expect(requireSharedExpense(repository, " expense-1 ")).resolves
      .toMatchObject({ id: "expense-1" });
  });
});

describe("assertExpenseParticipant", () => {
  it("accepts both participants and rejects outsiders", () => {
    const expense = buildSharedExpense();

    expect(() => assertExpenseParticipant(expense, "user-b")).not.toThrow();
    expect(() => assertExpenseParticipant(expense, "user-c")).toThrow(
      expect.objectContaining({ code: "NOT_PARTICIPANT" }),
    );
  });
});

describe("assertSameExpensePair", () => {
  it("accepts the stored pair and rejects any retarget", () => {
    const expense = buildSharedExpense();

    expect(() =>
      assertSameExpensePair(["user-a", "user-b"], expense),
    ).not.toThrow();
    expect(() => assertSameExpensePair(["user-a"], expense)).toThrow(
      expect.objectContaining({ code: "NOT_PARTICIPANT" }),
    );
    expect(() =>
      assertSameExpensePair(["user-a", "user-c"], expense),
    ).toThrow(expect.objectContaining({ code: "NOT_PARTICIPANT" }));
  });
});

describe("assertSharedExpensePayerWallet", () => {
  it("requires a wallet only when the viewer pays", () => {
    expect(() =>
      assertSharedExpensePayerWallet(buildValue({ walletId: null }), "user-a"),
    ).toThrow(expect.objectContaining({ code: "WALLET_REQUIRED" }));
    expect(() =>
      assertSharedExpensePayerWallet(buildValue(), "user-a"),
    ).not.toThrow();
    expect(() =>
      assertSharedExpensePayerWallet(
        buildValue({ payerId: "user-b", walletId: null }),
        "user-a",
      ),
    ).not.toThrow();
    expect(() =>
      assertSharedExpensePayerWallet(
        buildValue({ payerId: "user-b" }),
        "user-a",
      ),
    ).not.toThrow();
  });
});

describe("assertSharedExpenseFriendship", () => {
  it("rejects a pair without a usable friend uid", async () => {
    await expect(
      assertSharedExpenseFriendship(new FakeFriendsRepository(), "user-a", [
        "user-a",
      ]),
    ).rejects.toMatchObject({ code: "NOT_FRIEND" });
  });

  it("accepts an accepted friendship", async () => {
    const friendsRepository = new FakeFriendsRepository();
    friendsRepository.seedFriendship("user-a", "user-b");

    await expect(
      assertSharedExpenseFriendship(friendsRepository, "user-a", [
        "user-a",
        "user-b",
      ]),
    ).resolves.toBeUndefined();
  });
});
