import type {
  CreateSharedExpenseDto,
  UpdateSharedExpenseDto,
} from "../../types/shared-expense.types";

/** Valid `sharedExpenses` document payload; override only what the test asserts. */
export function buildExpenseDocument(
  overrides: object = {},
): Record<string, unknown> {
  return {
    participantIds: ["user-a", "user-b"],
    pairId: "user-a__user-b",
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
    revision: 0,
    ...overrides,
  };
}

export function buildCreateExpenseDto(): CreateSharedExpenseDto {
  return {
    participantIds: ["user-a", "user-b"],
    pairId: "user-a__user-b",
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
  };
}

export function buildUpdateExpenseDto(): UpdateSharedExpenseDto {
  return {
    payerId: "user-b",
    amountCents: 2000,
    currency: "EUR",
    splitMode: "equal",
    participants: [
      { userId: "user-a", shareCents: 1000 },
      { userId: "user-b", shareCents: 1000 },
    ],
    description: "Lunch",
    date: "2026-11-11",
    walletId: null,
    categoryId: null,
    updatedAt: "2026-11-11T10:00:00.000Z",
  };
}
