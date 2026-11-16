import type { SplitErrorCode } from "../types/shared-expense.types";
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
  | "splitMode";

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
  | SplitValueErrorCode
  | SplitErrorCode;

export interface SharedExpenseValidationIssue {
  field: SharedExpenseFormField;
  code: SharedExpenseValidationCode;
}

export type SharedExpenseFieldErrors = Partial<
  Record<SharedExpenseFormField, SharedExpenseValidationCode>
>;
