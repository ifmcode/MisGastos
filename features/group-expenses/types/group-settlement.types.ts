import type { CurrencyCode } from "@/shared/constants/currencies";

/**
 * Raw form payload of a group settlement, exactly as the group detail submits
 * it. The form opens from a debt row, so the pair and the direction are already
 * fixed; the service still validates them against the stored direct debt.
 */
export interface GroupSettlementInput {
  groupId: string;
  /** Debtor (payer) of the pair. */
  fromUserId: string;
  /** Creditor (receiver) of the pair. */
  toUserId: string;
  amount: string;
  currency: string;
  date: string;
  note?: string;
  /** Optional receiver (creditor) wallet; `undefined` keeps it social-only. */
  walletId?: string;
  /** Income category of the linked movement; required when a wallet is linked. */
  categoryId?: string;
}

/** Normalized payload handed to the service: integer cents and resolved codes. */
export interface ValidatedGroupSettlement {
  groupId: string;
  fromUserId: string;
  toUserId: string;
  amountCents: number;
  currency: CurrencyCode;
  date: string;
  note: string;
  walletId: string | null;
  categoryId: string | null;
}

/**
 * `groupSettlements/{settlementId}` document. Like `groupExpenses` it lives in a
 * ROOT collection with a `groupId` field and a client-generated id: one
 * single-field `where('groupId', '==', groupId)` plus a client-side sort, so no
 * composite index is needed. A `groups/{groupId}/settlements` subcollection was
 * rejected on purpose: the creditor income is validated in the rules with one
 * `getAfter` on a known root path plus one `get` on the group, and the
 * settlement id never builds a Firestore path from user input outside the
 * service.
 *
 * Applied by existing, exactly like the 1:1 `settlements`: there is no pending
 * state, `deletedAt: null` means the row counts in the group ledger and the
 * record is never hard-deleted. `fromUserId` is the debtor (payer) and
 * `toUserId` the creditor (receiver). Only the creditor may link a wallet, and
 * the three receiver fields are either all `null` or all set.
 */
export interface GroupSettlement {
  id: string;
  groupId: string;
  /** Sorted debtor/creditor pair, so `participantIds[0] < participantIds[1]`. */
  participantIds: string[];
  pairId: string;
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
export type CreateGroupSettlementDto = Omit<
  GroupSettlement,
  "id" | "revision"
>;

/**
 * Mutable fields of a settlement. `groupId`, `participantIds`, `pairId`,
 * `fromUserId`, `toUserId`, `currency`, `createdBy` and `createdAt` are
 * immutable, so they never appear here. `receiverTransactionId` is optional
 * because persistence owns the linked movement id.
 */
export interface UpdateGroupSettlementDto {
  amountCents: number;
  date: string;
  note: string;
  updatedAt: string;
  receiverWalletId: string | null;
  receiverCategoryId: string | null;
  receiverTransactionId?: string | null;
}
