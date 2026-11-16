import type { CurrencyCode } from "@/shared/constants/currencies";

/**
 * Movement data the shared-expense operations need to write. The port converts
 * `amountCents` to the decimal `amount` Firestore stores, so no caller handles
 * both representations.
 */
export interface LinkedMovementWriteInput {
  movementId: string;
  /** Payer (and wallet) owner; linked movements are only ever the viewer's. */
  ownerId: string;
  walletId: string;
  sharedExpenseId: string;
  amountCents: number;
  currency: CurrencyCode;
  categoryId: string;
  concept: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

/** Read view of a movement document, free of Firestore types. */
export interface LinkedMovementSnapshot {
  exists: boolean;
  data: Record<string, unknown> | undefined;
}

/** Interpreted movement document: only what the balance sync depends on. */
export interface LinkedMovementState {
  id: string;
  ownerId: string;
  walletId: string;
  amountCents: number;
  currency: string;
  deletedAt: string | null;
  createdAt: string | null;
}

/**
 * Seam between `features/shared-expenses` and the transaction persistence. It
 * keeps the feature independent of `firebase/*` and of the transaction
 * repository implementation.
 */
export interface ILinkedMovementPort {
  /** Full document for a new movement (`set`). */
  buildCreateData(input: LinkedMovementWriteInput): Record<string, unknown>;

  /** Patch for an existing movement (`update`); creation stamp is preserved. */
  buildUpdateData(input: LinkedMovementWriteInput): Record<string, unknown>;

  /** Reads a snapshot taken inside the transaction; null when unusable. */
  readMovement(
    movementId: string,
    snapshot: LinkedMovementSnapshot,
  ): LinkedMovementState | null;

  /** Single conversion boundary: integer cents to the stored decimal amount. */
  toAmount(amountCents: number): number;

  /** Expense effect on a wallet balance. */
  applyAmountToBalance(balance: number, amountCents: number): number;

  /** Reverts the effect of one movement from a wallet balance. */
  revertAmountFromBalance(balance: number, amountCents: number): number;
}
