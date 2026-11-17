import type { SharedExpense } from "../types/shared-expense.types";

/**
 * Legacy viewer-paid expense saved before the wallet became mandatory: it stays
 * readable, but its spend never reached Movements. A linked movement whose
 * wallet was orphaned (`-1`) keeps a `walletId`, so it is not this case.
 */
export function hasViewerPaidWithoutWallet(
  expense: SharedExpense,
  viewerUid: string,
): boolean {
  return expense.payerId === viewerUid && expense.walletId === null;
}
