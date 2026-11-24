import type { Wallet } from "@/features/wallets/types/wallet.types";

import {
  createSharedExpenseFormValues,
  type SharedExpenseFormValues,
} from "../shared-expense-form";

/** Builders of the wallet-link utils tests; not a test file itself. */
export function buildLinkWallet(overrides: Partial<Wallet> = {}): Wallet {
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
    revision: 0,
    createdAt: "2026-11-01T10:00:00.000Z",
    updatedAt: "2026-11-01T10:00:00.000Z",
    ...overrides,
  };
}

export function buildLinkFormValues(
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
