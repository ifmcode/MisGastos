import type { CurrencyCode } from "@/shared/constants/currencies";

import type {
  ExpenseSplitMode,
  SharedExpenseParticipant,
  SharedExpenseParticipantInput,
} from "@/features/shared-expenses/types/shared-expense.types";

// The four split modes and the participant rows are shared with the 1:1 slice,
// so the money math is never duplicated for groups.
export type {
  ExpenseSplitMode,
  SharedExpenseParticipant,
  SharedExpenseParticipantInput,
  SplitParticipantInput,
} from "@/features/shared-expenses/types/shared-expense.types";

/** Mirrors `SHARED_EXPENSE_DESCRIPTION_MAX_LENGTH` and the group-expense rules. */
export const GROUP_EXPENSE_DESCRIPTION_MAX_LENGTH = 120;
/** 1,000,000.00 major units; mirrored by `firestore.rules`. */
export const GROUP_EXPENSE_AMOUNT_MAX_CENTS = 100_000_000;
/** GROUP_MAX_MEMBERS: a group has at most 20 active members. */
export const GROUP_EXPENSE_MAX_PARTICIPANTS = 20;

/** Raw form payload of a group expense, exactly as the form submits it. */
export interface GroupExpenseInput {
  groupId: string;
  description: string;
  amount: string;
  currency: string;
  date: string;
  payerId: string;
  splitMode: string;
  /** Selected participants only: the payer may be excluded (pays for others). */
  participants: SharedExpenseParticipantInput[];
}

/** Normalized payload handed to the service: integer cents and exact shares. */
export interface ValidatedGroupExpense {
  groupId: string;
  payerId: string;
  amountCents: number;
  currency: CurrencyCode;
  splitMode: ExpenseSplitMode;
  participants: SharedExpenseParticipant[];
  description: string;
  date: string;
}

/**
 * `groupExpenses/{expenseId}` document. The id is client-generated (like a 1:1
 * shared expense) and the record lives in a ROOT collection with a `groupId`
 * field: one single-field `where('groupId', '==', groupId)` plus a client-side
 * sort, so no composite index is needed. A `groups/{groupId}/expenses`
 * subcollection would save the group read in the rules but would make a
 * cross-group "my expenses" query impossible without a collection group index.
 *
 * There is no `participantIds` field on purpose: the list is queryable through
 * `groupId` plus the group `memberIds`, and the shares are read whole with the
 * expense. Money is integer cents and the currency is stored PER EXPENSE; the
 * group `defaultCurrency` is only the initial form value and is never a
 * conversion source. Group expenses never touch personal wallets, categories or
 * linked movements.
 */
export interface GroupExpense {
  id: string;
  groupId: string;
  payerId: string;
  amountCents: number;
  currency: CurrencyCode;
  splitMode: ExpenseSplitMode;
  participants: SharedExpenseParticipant[];
  description: string;
  date: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

/** Payload the repository persists for a new expense; the id is generated there. */
export type CreateGroupExpenseDto = Omit<GroupExpense, "id"> & {
  deletedAt: null;
};

/**
 * Mutable fields of an expense. `groupId`, `createdBy` and `createdAt` are
 * immutable after creation, so they never appear here.
 */
export interface UpdateGroupExpenseDto {
  payerId: string;
  amountCents: number;
  currency: CurrencyCode;
  splitMode: ExpenseSplitMode;
  participants: SharedExpenseParticipant[];
  description: string;
  date: string;
  updatedAt: string;
}

/**
 * Raw "who owes whom" row produced by a group expense: `fromUserId` (debtor)
 * owes `toUserId` (payer) `amountCents`. TICKET-010 folds these rows into nets
 * and simplified suggestions; this layer only emits the direct debts.
 */
export interface GroupExpenseLedgerEntry {
  id: string;
  groupId: string;
  fromUserId: string;
  toUserId: string;
  amountCents: number;
  currency: CurrencyCode;
}
