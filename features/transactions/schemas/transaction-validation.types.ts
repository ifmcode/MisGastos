export const TRANSACTION_CONCEPT_MAX_LENGTH = 80;
export const TRANSACTION_NOTES_MAX_LENGTH = 300;
export const TRANSACTION_AMOUNT_MAX = 999_999_999_999.99;

export type TransactionFormField =
  | "ownerId"
  | "transactionId"
  | "type"
  | "amount"
  | "currency"
  | "walletId"
  | "categoryId"
  | "concept"
  | "notes"
  | "date";

export type TransactionValidationCode =
  | "OWNER_REQUIRED"
  | "TRANSACTION_REQUIRED"
  | "INVALID_TYPE"
  | "INVALID_AMOUNT"
  | "INVALID_CURRENCY"
  | "WALLET_REQUIRED"
  | "INVALID_CATEGORY"
  | "CATEGORY_TYPE_MISMATCH"
  | "CONCEPT_REQUIRED"
  | "CONCEPT_TOO_LONG"
  | "NOTES_TOO_LONG"
  | "INVALID_DATE";

export interface TransactionValidationIssue {
  field: TransactionFormField;
  code: TransactionValidationCode;
  message: string;
}

export type TransactionValidationErrors = Partial<
  Record<TransactionFormField, string>
>;

/**
 * Input accepted by transaction validation. Values are strings because they
 * come from forms or Firestore and must be checked at runtime.
 */
export interface TransactionInput {
  type: string;
  amount: string | number;
  currency: string;
  walletId: string;
  categoryId: string;
  concept: string;
  notes?: string | null;
  date: string;
}
