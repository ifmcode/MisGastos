export const WALLET_NAME_MAX_LENGTH = 40;
export const WALLET_DESCRIPTION_MAX_LENGTH = 160;
export const WALLET_MAX_AMOUNT = 999_999_999_999.99;

export type WalletFormField =
  | "ownerId"
  | "name"
  | "currency"
  | "icon"
  | "color"
  | "initialBalance"
  | "type"
  | "includeInTotal"
  | "description";

export type WalletValidationCode =
  | "OWNER_REQUIRED"
  | "NAME_REQUIRED"
  | "NAME_TOO_LONG"
  | "INVALID_CURRENCY"
  | "INVALID_ICON"
  | "INVALID_COLOR"
  | "INVALID_AMOUNT"
  | "NEGATIVE_AMOUNT"
  | "INVALID_TYPE"
  | "INVALID_INCLUDE_IN_TOTAL"
  | "DESCRIPTION_TOO_LONG";

export interface WalletValidationIssue {
  field: WalletFormField;
  code: WalletValidationCode;
  message: string;
}

export type WalletValidationErrors = Partial<Record<WalletFormField, string>>;

/**
 * Input accepted by business validation. `currency`, `type` and `icon` are
 * strings here so values coming from forms or Firestore are checked at runtime.
 */
export interface WalletInput {
  name: string;
  currency: string;
  icon: string;
  color: string;
  initialBalance: string | number;
  type: string;
  includeInTotal: boolean;
  description?: string | null;
}
