import type { CurrencyCode } from "@/shared/constants/currencies";
import { toWalletBalance } from "@/features/transactions/repositories/transaction-firestore.utils";

import { SettlementOperationError } from "../services/settlement.errors";
import type { Settlement } from "../types/settlement.types";
import type { SettlementMovementSnapshot } from "./settlement-movement.port";
import { mapSettlementDocument } from "./settlements.mapper";

/** Default factory: the 1:1 flow keeps raising its own error class. */
function defaultSettlementError(code: SettlementLinkErrorCode): Error {
  return new SettlementOperationError(code);
}

/** Minimal document read view shared by settlement, movement and wallet reads. */
export interface SettlementSnapshotView {
  exists(): boolean;
  data(): Record<string, unknown> | undefined;
}

/**
 * Codes the shared settlement helpers can raise. Both the 1:1 and the group
 * flow speak this set, so the caller injects the error class it owns and the
 * service keeps mapping stable codes instead of a generic failure.
 */
export type SettlementLinkErrorCode =
  | "WALLET_NOT_FOUND"
  | "WALLET_NOT_OWNED"
  | "CURRENCY_MISMATCH"
  | "WALLET_ARCHIVED"
  | "CATEGORY_REQUIRED"
  | "AMOUNT_LOCKED";

export type SettlementErrorFactory = (code: SettlementLinkErrorCode) => Error;

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
  onError: SettlementErrorFactory = defaultSettlementError,
): void {
  if (walletId !== null && categoryId === null) {
    throw onError("CATEGORY_REQUIRED");
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
  onError: SettlementErrorFactory = defaultSettlementError,
): number {
  if (!snapshot.exists()) {
    throw onError("WALLET_NOT_FOUND");
  }

  const data = snapshot.data() ?? {};

  if (data.ownerId !== creditorId) {
    throw onError("WALLET_NOT_OWNED");
  }

  if (data.currency !== currency) {
    throw onError("CURRENCY_MISMATCH");
  }

  const archivedAt = data.archivedAt;
  if (
    !allowArchived &&
    typeof archivedAt === "string" &&
    archivedAt.trim().length > 0
  ) {
    throw onError("WALLET_ARCHIVED");
  }

  return toWalletBalance(data);
}
