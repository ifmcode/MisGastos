import type { SharedExpense } from "../../types/shared-expense.types";

/** Minimal 1:1 shared expense document; override only what the test asserts. */
export function buildSharedExpense(
  overrides: Partial<SharedExpense> = {},
): SharedExpense {
  return {
    id: "expense-1",
    pairId: "user-a__user-b",
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
    walletId: null,
    categoryId: null,
    linkedTransactionId: null,
    createdBy: "user-a",
    createdAt: "2026-11-10T20:00:00.000Z",
    updatedAt: "2026-11-10T20:00:00.000Z",
    deletedAt: null,
    ...overrides,
  };
}
