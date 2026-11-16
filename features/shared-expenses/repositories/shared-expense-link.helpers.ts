import type { CurrencyCode } from "@/shared/constants/currencies";
import { toWalletBalance } from "@/features/transactions/repositories/transaction-firestore.utils";

import { SharedExpenseOperationError } from "../services/shared-expense.errors";
import type { SharedExpense } from "../types/shared-expense.types";
import type { LinkedMovementSnapshot } from "./linked-movement.port";
import { mapSharedExpenseDocument } from "./shared-expenses.mapper";

/** Minimal document read view shared by expense, movement and wallet snapshots. */
export interface SnapshotView {
  exists(): boolean;
  data(): Record<string, unknown> | undefined;
}

export function toMovementSnapshot(
  snapshot: SnapshotView,
): LinkedMovementSnapshot {
  const exists = snapshot.exists();

  return { exists, data: exists ? snapshot.data() : undefined };
}

export function readExpenseDocument(
  expenseId: string,
  snapshot: SnapshotView,
): SharedExpense {
  const expense = snapshot.exists()
    ? mapSharedExpenseDocument(expenseId, snapshot.data() ?? {})
    : null;

  if (!expense) throw new SharedExpenseOperationError("EXPENSE_NOT_FOUND");

  return expense;
}

/**
 * Reads and validates a wallet inside the transaction: it must exist, belong to
 * the caller and share the expense currency before any balance is computed.
 */
export function readWalletBalance(
  snapshot: SnapshotView,
  ownerId: string,
  currency: CurrencyCode,
): number {
  if (!snapshot.exists()) {
    throw new SharedExpenseOperationError("WALLET_NOT_FOUND");
  }

  const data = snapshot.data() ?? {};

  if (data.ownerId !== ownerId) {
    throw new SharedExpenseOperationError("WALLET_NOT_OWNED");
  }

  if (data.currency !== currency) {
    throw new SharedExpenseOperationError("CURRENCY_MISMATCH");
  }

  return toWalletBalance(data);
}

/** An expense can never leave a wallet negative. */
export function assertSufficientBalance(balance: number): void {
  if (balance < 0) {
    throw new SharedExpenseOperationError("INSUFFICIENT_BALANCE");
  }
}
