import type { CurrencyCode } from "@/shared/constants/currencies";

/**
 * Form payload of a settlement, exactly as the screen submits it. The direction
 * is never part of the form: it is derived from the pair's net debt.
 */
export interface SettlementInput {
  friendUid: string;
  currency: string;
  amount: string;
  date: string;
  note?: string;
  /** Optional receiver (creditor) wallet; `undefined` keeps it social-only. */
  walletId?: string;
  /** Income category of the linked movement; required when a wallet is linked. */
  categoryId?: string;
}

/** Normalized payload handed to the service: integer cents and resolved codes. */
export interface ValidatedSettlement {
  friendUid: string;
  amountCents: number;
  currency: CurrencyCode;
  date: string;
  note: string;
  walletId: string | null;
  categoryId: string | null;
}

/**
 * `settlements/{settlementId}` document. It is applied by existing: there is no
 * pending state, and `deletedAt: null` means the settlement counts in the pair
 * ledger. The record is never hard-deleted.
 *
 * `fromUserId` is the debtor (payer), `toUserId` the creditor (receiver). Only
 * the creditor may link a wallet, and the three receiver fields are either all
 * `null` or all set.
 */
export interface Settlement {
  id: string;
  pairId: string;
  participantIds: string[];
  fromUserId: string;
  toUserId: string;
  amountCents: number;
  currency: CurrencyCode;
  date: string;
  note: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  receiverWalletId: string | null;
  receiverCategoryId: string | null;
  receiverTransactionId: string | null;
  /** Optimistic-concurrency counter; legacy documents map to 0. */
  revision: number;
}

/** Payload the repository persists for a new settlement; the id is generated there. */
export type CreateSettlementDto = Omit<Settlement, "id" | "revision">;

/**
 * Mutable fields of a settlement. `participantIds`, `pairId`, `fromUserId`,
 * `toUserId`, `currency`, `createdBy` and `createdAt` are immutable, so they
 * never appear here. `receiverTransactionId` is optional because persistence
 * owns the linked movement id.
 */
export interface UpdateSettlementDto {
  amountCents: number;
  date: string;
  note: string;
  updatedAt: string;
  receiverWalletId: string | null;
  receiverCategoryId: string | null;
  receiverTransactionId?: string | null;
}

/**
 * Ledger row produced by a settlement. A settlement cancels debt, so the row is
 * the reverse edge (`toUserId` owes `fromUserId`). Structurally identical to
 * `FriendLedgerEntry`, so the friends balance fold consumes it unchanged.
 */
export interface SettlementLedgerEntry {
  id: string;
  fromUserId: string;
  toUserId: string;
  amountCents: number;
  currency: CurrencyCode;
  deletedAt: string | null;
}

/** Which side of the pair the settlement money moved from. */
export type SettlementDirection =
  | "viewer-owes-friend"
  | "friend-owes-viewer"
  | "settled";

/** Resolved pair direction of a settlement, or `null` when nothing is owed. */
export interface SettlementParticipants {
  fromUserId: string;
  toUserId: string;
  viewerIsCreditor: boolean;
}
