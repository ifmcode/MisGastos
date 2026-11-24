import { Transaction } from "../../types/transaction.types";

export const LOCAL_TEST_OWNER = "owner-1";

export function buildTransaction(
  overrides: Partial<Transaction> = {},
): Transaction {
  return {
    id: "transaction-1",
    type: "expense",
    amount: 25.5,
    currency: "EUR",
    walletId: "wallet-1",
    categoryId: "category-1",
    concept: "Cena",
    notes: "Cumpleaños",
    date: "2026-10-29",
    ownerId: LOCAL_TEST_OWNER,
    revision: 4,
    sharedExpenseId: "shared-1",
    groupExpenseId: "group-1",
    createdAt: "2026-10-29T10:00:00.000Z",
    updatedAt: "2026-10-29T11:00:00.000Z",
    deletedAt: null,
    ...overrides,
  };
}
