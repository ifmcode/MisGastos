import type { CurrencyCode } from "@/shared/constants/currencies";
import type { LinkedMovementSnapshot } from "@/features/shared-expenses/repositories/linked-movement.port";
import type { SnapshotView } from "@/features/shared-expenses/repositories/shared-expense-link.helpers";
import { toWalletBalance } from "@/features/transactions/repositories/transaction-firestore.utils";

import { GroupExpenseOperationError } from "../services/group-expense.errors";
import type { GroupExpense } from "../types/group-expense.types";
import { mapGroupExpenseDocument } from "./group-expenses.mapper";

export function toMovementSnapshot(
  snapshot: SnapshotView,
): LinkedMovementSnapshot {
  const exists = snapshot.exists();

  return { exists, data: exists ? snapshot.data() : undefined };
}

export function readGroupExpenseDocument(
  expenseId: string,
  snapshot: SnapshotView,
): GroupExpense {
  const expense = snapshot.exists()
    ? mapGroupExpenseDocument(expenseId, snapshot.data() ?? {})
    : null;

  if (!expense) throw new GroupExpenseOperationError("EXPENSE_NOT_FOUND");

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
    throw new GroupExpenseOperationError("WALLET_NOT_FOUND");
  }

  const data = snapshot.data() ?? {};

  if (data.ownerId !== ownerId) {
    throw new GroupExpenseOperationError("WALLET_NOT_OWNED");
  }

  if (data.currency !== currency) {
    throw new GroupExpenseOperationError("CURRENCY_MISMATCH");
  }

  return toWalletBalance(data);
}

/** An expense can never leave a wallet negative. */
export function assertSufficientBalance(balance: number): void {
  if (balance < 0) {
    throw new GroupExpenseOperationError("INSUFFICIENT_BALANCE");
  }
}
