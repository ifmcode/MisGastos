import type { CurrencyCode } from "@/shared/constants/currencies";
import { toWalletBalance } from "@/features/transactions/repositories/transaction-firestore.utils";

import { SettlementOperationError } from "../services/settlement.errors";
import type { Settlement } from "../types/settlement.types";
import type { SettlementMovementSnapshot } from "./settlement-movement.port";
import { mapSettlementDocument } from "./settlements.mapper";

/** Minimal document read view shared by settlement, movement and wallet reads. */
export interface SettlementSnapshotView {
  exists(): boolean;
  data(): Record<string, unknown> | undefined;
}

export function toSettlementMovementSnapshot(
  snapshot: SettlementSnapshotView,
): SettlementMovementSnapshot {
  const exists = snapshot.exists();

  return { exists, data: exists ? snapshot.data() : undefined };
}

/**
 * The receiver link is all-or-nothing. The form already reports the missing
 * category; this guard protects a caller that bypasses the schema, because a
 * partial link is rejected by the mapper and by `firestore.rules`.
 */
export function assertSettlementLinkShape(
  walletId: string | null,
  categoryId: string | null,
): void {
  if (walletId !== null && categoryId === null) {
    throw new SettlementOperationError("CATEGORY_REQUIRED");
  }
}

export function readSettlementDocument(
  settlementId: string,
  snapshot: SettlementSnapshotView,
): Settlement {
  const settlement = snapshot.exists()
    ? mapSettlementDocument(settlementId, snapshot.data() ?? {})
    : null;

  if (!settlement) throw new SettlementOperationError("SETTLEMENT_NOT_FOUND");

  return settlement;
}

/**
 * Reads and validates a wallet inside the transaction. The settlement income
 * always belongs to the creditor, so the wallet must be theirs and in the
 * settlement currency before any balance is touched. A wallet archived after
 * the link is still valid to revert the income, but never to link a new one.
 */
export function readSettlementWallet(
  snapshot: SettlementSnapshotView,
  creditorId: string,
  currency: CurrencyCode,
  allowArchived = false,
): number {
  if (!snapshot.exists()) {
    throw new SettlementOperationError("WALLET_NOT_FOUND");
  }

  const data = snapshot.data() ?? {};

  if (data.ownerId !== creditorId) {
    throw new SettlementOperationError("WALLET_NOT_OWNED");
  }

  if (data.currency !== currency) {
    throw new SettlementOperationError("CURRENCY_MISMATCH");
  }

  const archivedAt = data.archivedAt;
  if (
    !allowArchived &&
    typeof archivedAt === "string" &&
    archivedAt.trim().length > 0
  ) {
    throw new SettlementOperationError("WALLET_ARCHIVED");
  }

  return toWalletBalance(data);
}
