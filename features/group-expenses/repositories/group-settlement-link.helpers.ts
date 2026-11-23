import type { CurrencyCode } from "@/shared/constants/currencies";

import { GroupExpenseOperationError } from "../services/group-expense.errors";
import type { GroupSettlement } from "../types/group-settlement.types";
import type { SettlementErrorFactory } from "@/features/settlements/repositories/settlement-wallet.helpers";
import {
  readSettlementWallet,
  type SettlementSnapshotView,
} from "@/features/settlements/repositories/settlement-wallet.helpers";
import { mapGroupSettlementDocument } from "./group-settlements.mapper";

/**
 * The shared settlement helpers speak the 1:1 error class by default. The group
 * flow injects this factory so every failure reaches the service as a
 * `GroupExpenseOperationError` and `getGroupExpenseErrorCode` keeps its codes.
 */
export const groupSettlementError: SettlementErrorFactory = (code) =>
  new GroupExpenseOperationError(code);

/** Loads the document or fails with the group settlement code. */
export function readGroupSettlementDocument(
  settlementId: string,
  snapshot: SettlementSnapshotView,
): GroupSettlement {
  const settlement = snapshot.exists()
    ? mapGroupSettlementDocument(settlementId, snapshot.data() ?? {})
    : null;

  if (!settlement) {
    throw new GroupExpenseOperationError("SETTLEMENT_NOT_FOUND");
  }

  return settlement;
}

/** The receiver link is all-or-nothing, as in the 1:1 settlement. */
export function assertGroupSettlementLinkShape(
  walletId: string | null,
  categoryId: string | null,
): void {
  if (walletId !== null && categoryId === null) {
    throw new GroupExpenseOperationError("CATEGORY_REQUIRED");
  }
}

/**
 * Reads and validates the creditor wallet inside the transaction. The income is
 * always the receiver's, so the wallet must be theirs and in the settlement
 * currency. A wallet archived after the link can still be reverted, but never
 * receive a new income.
 */
export function readGroupSettlementWallet(
  snapshot: SettlementSnapshotView,
  creditorId: string,
  currency: CurrencyCode,
  allowArchived = false,
): number {
  return readSettlementWallet(
    snapshot,
    creditorId,
    currency,
    allowArchived,
    groupSettlementError,
  );
}
