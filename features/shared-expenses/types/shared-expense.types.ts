import type { CurrencyCode } from "@/shared/constants/currencies";
import type { Result } from "@/shared/types/common.types";

/** Split strategies. The four modes work for 1:1 today and for groups later. */
export type ExpenseSplitMode = "equal" | "percentage" | "fixed" | "shares";

export const EXPENSE_SPLIT_MODES: readonly ExpenseSplitMode[] = [
  "equal",
  "percentage",
  "fixed",
  "shares",
];

/** Raw participant row coming from the form; `value` is read according to the mode. */
export interface SharedExpenseParticipantInput {
  userId: string;
  value: string;
}

/**
 * Persisted share of one participant. `shareCents` always sums to the expense
 * total; `percentageBps` (1..10000) and `weight` only exist for their mode.
 */
export interface SharedExpenseParticipant {
  userId: string;
  shareCents: number;
  percentageBps?: number;
  weight?: number;
}

/** Numeric participant row the split receives once the schema parsed `value`. */
export interface SplitParticipantInput {
  userId: string;
  value: number;
}

export type SplitErrorCode =
  | "INVALID_TOTAL"
  | "INVALID_PARTICIPANTS"
  | "INVALID_PERCENTAGE"
  | "PERCENTAGE_SUM_MISMATCH"
  | "INVALID_FIXED_AMOUNT"
  | "FIXED_SUM_MISMATCH"
  | "INVALID_SHARES"
  | "SHARES_SUM_INVALID";

/** Result of every split helper: exact shares or the reason they were rejected. */
export type SplitResult = Result<SharedExpenseParticipant[], SplitErrorCode>;

/** Form payload of a shared expense, exactly as the screen submits it. */
export interface SharedExpenseInput {
  friendUid: string;
  description: string;
  amount: string;
  currency: string;
  date: string;
  payerId: string;
  splitMode: string;
  participants: SharedExpenseParticipantInput[];
  /** Optional wallet of the payer; `undefined`/empty keeps the expense social. */
  walletId?: string;
  /** Optional expense category for the linked movement. */
  categoryId?: string;
}

/** Normalized payload handed to the service: integer cents and resolved codes. */
export interface ValidatedSharedExpense {
  participantIds: string[];
  payerId: string;
  amountCents: number;
  currency: CurrencyCode;
  splitMode: ExpenseSplitMode;
  participants: SharedExpenseParticipant[];
  description: string;
  date: string;
  walletId: string | null;
  categoryId: string | null;
  /** Persistence-owned: the form never supplies it, so it is null on create. */
  linkedTransactionId: string | null;
}

/**
 * `sharedExpenses/{expenseId}` document. The id is client-generated and unique
 * per expense; the sorted participant pair lives in the `pairId` field (joined
 * with `__`), never in the id. Money is integer cents.
 *
 * `walletId`, `categoryId` and `linkedTransactionId` are `null` for social-only
 * expenses; otherwise they describe the single linked movement of the payer.
 */
export interface SharedExpense {
  id: string;
  pairId: string;
  participantIds: string[];
  payerId: string;
  amountCents: number;
  currency: CurrencyCode;
  splitMode: ExpenseSplitMode;
  participants: SharedExpenseParticipant[];
  description: string;
  date: string;
  walletId: string | null;
  categoryId: string | null;
  linkedTransactionId: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

/** Payload the repository persists for a new expense; the id is generated there. */
export type CreateSharedExpenseDto = Omit<SharedExpense, "id"> & {
  deletedAt: null;
};

/**
 * Mutable fields of an expense. `participantIds`, `pairId`, `createdBy` and
 * `createdAt` are immutable after creation, so they never appear here.
 * `linkedTransactionId` is optional because persistence owns it: the social-only
 * path must not clobber the stored value.
 */
export interface UpdateSharedExpenseDto {
  payerId: string;
  amountCents: number;
  currency: CurrencyCode;
  splitMode: ExpenseSplitMode;
  participants: SharedExpenseParticipant[];
  description: string;
  date: string;
  walletId: string | null;
  categoryId: string | null;
  linkedTransactionId?: string | null;
  updatedAt: string;
}

/**
 * Ledger row produced by a shared expense: `fromUserId` owes `toUserId`.
 * Structurally identical to `FriendLedgerEntry`, so the friends balance fold
 * consumes it without a mapper.
 */
export interface SharedExpenseLedgerEntry {
  id: string;
  fromUserId: string;
  toUserId: string;
  amountCents: number;
  currency: CurrencyCode;
  deletedAt: string | null;
}
