import type { CurrencyCode } from "@/shared/constants/currencies";

/**
 * Movement data the settlement operations need to write. The port converts
 * `amountCents` to the decimal `amount` Firestore stores, so no caller handles
 * both representations.
 */
export interface SettlementMovementWriteInput {
  movementId: string;
  /** Creditor (and wallet) owner; the movement is only ever theirs. */
  ownerId: string;
  walletId: string;
  settlementId: string;
  amountCents: number;
  currency: CurrencyCode;
  categoryId: string;
  concept: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

/** Read view of a movement document, free of Firestore types. */
export interface SettlementMovementSnapshot {
  exists: boolean;
  data: Record<string, unknown> | undefined;
}

/** Interpreted movement document: only what the balance sync depends on. */
export interface SettlementMovementState {
  id: string;
  ownerId: string;
  walletId: string;
  amountCents: number;
  currency: string;
  deletedAt: string | null;
  createdAt: string | null;
}

/**
 * Seam between `features/settlements` and the transaction persistence. It keeps
 * the feature independent of `firebase/*` and of the transaction repository
 * implementation, and reuses the same document shape as a normal income.
 */
export interface ISettlementMovementPort {
  /** Full document for a new income (`set`). */
  buildCreateData(
    input: SettlementMovementWriteInput,
  ): Record<string, unknown>;

  /** Patch for an existing income (`update`); creation stamp is preserved. */
  buildUpdateData(
    input: SettlementMovementWriteInput,
  ): Record<string, unknown>;

  /** Reads a snapshot taken inside the transaction; null when unusable. */
  readMovement(
    movementId: string,
    snapshot: SettlementMovementSnapshot,
  ): SettlementMovementState | null;

  /** Single conversion boundary: integer cents to the stored decimal amount. */
  toAmount(amountCents: number): number;

  /** Income effect on a wallet balance. */
  applyAmountToBalance(balance: number, amountCents: number): number;

  /** Reverts the effect of one income from a wallet balance. */
  revertAmountFromBalance(balance: number, amountCents: number): number;
}
