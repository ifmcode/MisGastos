import type { CurrencyCode } from "@/shared/constants/currencies";

import type {
  ExpenseSplitMode,
  SplitErrorCode,
} from "@/features/shared-expenses/types/shared-expense.types";
import type { SplitValueErrorCode } from "@/features/shared-expenses/utils/expense-split-values";

export type GroupExpenseFormField =
  | "groupId"
  | "description"
  | "amount"
  | "date"
  | "currency"
  | "payerId"
  | "participants"
  | "splitMode"
  | "walletId"
  | "categoryId";

/** Stable strings; the UI translates them and the service never returns copy. */
export type GroupExpenseValidationCode =
  | "GROUP_REQUIRED"
  | "NOT_GROUP_MEMBER"
  | "DESCRIPTION_REQUIRED"
  | "DESCRIPTION_TOO_LONG"
  | "AMOUNT_REQUIRED"
  | "AMOUNT_INVALID"
  | "AMOUNT_TOO_HIGH"
  | "CURRENCY_INVALID"
  | "DATE_INVALID"
  | "PAYER_REQUIRED"
  | "PAYER_NOT_MEMBER"
  | "PARTICIPANTS_REQUIRED"
  | "PARTICIPANTS_TOO_MANY"
  | "PARTICIPANT_INVALID"
  | "PARTICIPANTS_DUPLICATE"
  | "PARTICIPANT_NOT_MEMBER"
  | "SPLIT_MODE_INVALID"
  | "WALLET_REQUIRED"
  | "CATEGORY_REQUIRED"
  | "LINK_WITHOUT_REGISTRATION"
  | "CURRENCY_MISMATCH"
  | SplitValueErrorCode
  | SplitErrorCode;

export interface GroupExpenseValidationIssue {
  field: GroupExpenseFormField;
  code: GroupExpenseValidationCode;
}

/** Fields that survived validation, before the exact split is computed. */
export interface ParsedGroupExpense {
  groupId: string;
  description: string;
  amountCents: number;
  currency: CurrencyCode;
  date: string;
  payerId: string;
  splitMode: ExpenseSplitMode;
  walletId: string | null;
  categoryId: string | null;
}

export type GroupExpenseFieldErrors = Partial<
  Record<GroupExpenseFormField, GroupExpenseValidationCode>
>;
