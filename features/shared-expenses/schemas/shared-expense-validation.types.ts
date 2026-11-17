import type { CurrencyCode } from "@/shared/constants/currencies";

import type {
  ExpenseSplitMode,
  SplitErrorCode,
} from "../types/shared-expense.types";
import type { SplitValueErrorCode } from "../utils/expense-split-values";

export const SHARED_EXPENSE_DESCRIPTION_MAX_LENGTH = 120;
/** Maximum expense amount in major units (1,000,000.00). */
export const SHARED_EXPENSE_AMOUNT_MAX = 1_000_000;

export type SharedExpenseFormField =
  | "description"
  | "amount"
  | "date"
  | "currency"
  | "payerId"
  | "participants"
  | "splitMode"
  | "walletId"
  | "categoryId";

export type SharedExpenseValidationCode =
  | "DESCRIPTION_REQUIRED"
  | "DESCRIPTION_TOO_LONG"
  | "AMOUNT_REQUIRED"
  | "AMOUNT_INVALID"
  | "AMOUNT_TOO_HIGH"
  | "CURRENCY_INVALID"
  | "DATE_INVALID"
  | "PAYER_REQUIRED"
  | "PAYER_NOT_PARTICIPANT"
  | "PARTICIPANTS_INVALID"
  | "SPLIT_MODE_INVALID"
  | "WALLET_REQUIRED"
  | "CATEGORY_REQUIRED"
  | "CURRENCY_MISMATCH"
  | SplitValueErrorCode
  | SplitErrorCode;

export interface SharedExpenseValidationIssue {
  field: SharedExpenseFormField;
  code: SharedExpenseValidationCode;
}

/** Fields that survived validation, before the exact split is computed. */
export interface ParsedSharedExpense {
  description: string;
  amountCents: number;
  currency: CurrencyCode;
  date: string;
  payerId: string;
  participantIds: string[];
  splitMode: ExpenseSplitMode;
  walletId: string | null;
  categoryId: string | null;
}

export type SharedExpenseFieldErrors = Partial<
  Record<SharedExpenseFormField, SharedExpenseValidationCode>
>;
