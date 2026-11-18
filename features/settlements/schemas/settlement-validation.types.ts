/** Maximum settlement amount in major units (1,000,000.00). */
export const SETTLEMENT_AMOUNT_MAX = 1_000_000;
/** Maximum settlement amount in integer cents, mirrored by `firestore.rules`. */
export const SETTLEMENT_AMOUNT_MAX_CENTS = 100_000_000;
/** Maximum length of the free-text note. */
export const SETTLEMENT_NOTE_MAX_LENGTH = 500;

export type SettlementFormField =
  | "friendUid"
  | "amount"
  | "currency"
  | "date"
  | "note"
  | "walletId"
  | "categoryId";

export type SettlementValidationCode =
  | "FRIEND_NOT_FOUND"
  | "AMOUNT_REQUIRED"
  | "AMOUNT_INVALID"
  | "AMOUNT_TOO_HIGH"
  | "CURRENCY_INVALID"
  | "DATE_INVALID"
  | "DATE_IN_FUTURE"
  | "NOTE_TOO_LONG"
  | "CATEGORY_REQUIRED"
  | "WALLET_NOT_OWNED";

export interface SettlementValidationIssue {
  field: SettlementFormField;
  code: SettlementValidationCode;
}

export type SettlementFieldErrors = Partial<
  Record<SettlementFormField, SettlementValidationCode>
>;
