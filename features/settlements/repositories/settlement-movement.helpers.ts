import { collection, doc } from "firebase/firestore";

import { db } from "@/lib/firebase";
import type { CurrencyCode } from "@/shared/constants/currencies";
import { isOrphanedWalletId } from "@/features/wallets/utils/deleted-wallet";

import { SettlementOperationError } from "../services/settlement.errors";
import type { Settlement } from "../types/settlement.types";
import type {
  ISettlementMovementPort,
  SettlementMovementState,
} from "./settlement-movement.port";
import {
  readSettlementWallet,
  toSettlementMovementSnapshot,
  type SettlementErrorFactory,
  type SettlementLinkErrorCode,
  type SettlementSnapshotView,
} from "./settlement-wallet.helpers";

/** Default factory: the 1:1 flow keeps raising its own error class. */
function defaultSettlementError(
  code: "WALLET_NOT_OWNED" | SettlementLinkErrorCode,
): Error {
  return new SettlementOperationError(code);
}

export const TRANSACTIONS_COLLECTION = "transactions";
export const WALLETS_COLLECTION = "wallets";

/**
 * Machine token stored in `concept` when the settlement has no note. The UI
 * overrides the visible label of any movement whose `settlementId` is set, so
 * the token never reaches the user.
 */
export const SETTLEMENT_MOVEMENT_CONCEPT = "settlement";

export function resolveSettlementMovementConcept(note: string): string {
  const trimmed = note.trim();

  return trimmed.length > 0 ? trimmed : SETTLEMENT_MOVEMENT_CONCEPT;
}

export function settlementMovementRef(movementId: string) {
  return doc(db, TRANSACTIONS_COLLECTION, movementId);
}

/** Client-generated id so the movement exists after a single write. */
export function newSettlementMovementRef() {
  return doc(collection(db, TRANSACTIONS_COLLECTION));
}

export function settlementWalletRef(walletId: string) {
  return doc(db, WALLETS_COLLECTION, walletId);
}

/** Only the transaction surface the settlement operations use. */
export interface SettlementTransaction {
  get(reference: unknown): Promise<SettlementSnapshotView>;
  update(reference: unknown, data: Record<string, unknown>): void;
  set(reference: unknown, data: Record<string, unknown>): void;
}

/** Movement that still affects its wallet; soft-deleted ones were reverted. */
export function readActiveSettlementMovement(
  movement: SettlementMovementState | null,
): SettlementMovementState | null {
  return movement && movement.deletedAt === null ? movement : null;
}

export interface SettlementMovementWriteContext {
  creditorId: string;
  port: ISettlementMovementPort;
  now: string;
}

/**
 * Reads the linked income inside the transaction. Only the creditor can read
 * their own movement under the rules, so a debtor never calls this.
 */
export async function readStoredSettlementMovement(
  transaction: SettlementTransaction,
  settlement: Settlement,
  port: ISettlementMovementPort,
): Promise<SettlementMovementState | null> {
  const id = settlement.receiverTransactionId;

  if (!id) return null;

  const snapshot = await transaction.get(settlementMovementRef(id));

  return port.readMovement(id, toSettlementMovementSnapshot(snapshot));
}

/**
 * Reverts one income from the creditor wallet, exactly once per call. A
 * permanently deleted wallet keeps the movement without a real balance, and a
 * movement owned by someone else is never touched (rules would deny it anyway).
 */
export async function revertSettlementMovementWallet(
  transaction: SettlementTransaction,
  movement: SettlementMovementState,
  creditorId: string,
  currency: CurrencyCode,
  now: string,
  port: ISettlementMovementPort,
  onError: SettlementErrorFactory = defaultSettlementError,
): Promise<void> {
  if (movement.ownerId !== creditorId) {
    throw onError("WALLET_NOT_OWNED");
  }

  if (isOrphanedWalletId(movement.walletId)) return;

  const reference = settlementWalletRef(movement.walletId);
  const snapshot = await transaction.get(reference);
  // The wallet may have been archived after the link, so a revert is allowed.
  const balance = readSettlementWallet(
    snapshot,
    creditorId,
    currency,
    true,
    onError,
  );

  transaction.update(reference, {
    balance: port.revertAmountFromBalance(balance, movement.amountCents),
    updatedAt: now,
  });
}

