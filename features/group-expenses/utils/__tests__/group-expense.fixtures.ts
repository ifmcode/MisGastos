import type { GroupExpense } from "../../types/group-expense.types";

export const GROUP_ID = "user-a__group-1";
export const CREATED_AT = "2026-11-10T20:00:00.000Z";

/** Active group expense paid by `user-a` and split 50/50 with `user-b`. */
export function buildGroupExpense(
  overrides: Partial<GroupExpense> = {},
): GroupExpense {
  return {
    id: "expense-1",
    groupId: GROUP_ID,
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
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
    deletedAt: null,
    ...overrides,
  };
}
