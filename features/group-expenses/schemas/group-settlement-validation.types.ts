/**
 * Maximum length of a group settlement note. Reuses the 1:1 limit so both
 * settlement flows share one number and one rules bound (500).
 */
export { SETTLEMENT_NOTE_MAX_LENGTH } from "@/features/settlements/schemas/settlement-validation.types";
/** 1,000,000.00 major units, mirrored by `firestore.rules` (100,000,000 cents). */
export { SETTLEMENT_AMOUNT_MAX_CENTS } from "@/features/settlements/schemas/settlement-validation.types";

export type GroupSettlementFormField =
  | "groupId"
  | "fromUserId"
  | "toUserId"
  | "amount"
  | "currency"
  | "date"
  | "note"
  | "walletId"
  | "categoryId";

/**
 * Stable field codes. The pair, the direction and the debt bound need the group
 * ledger, so their operation codes live in `group-settlement.errors.ts`; these
 * ones are pure shape checks of the submitted form.
 */
export type GroupSettlementValidationCode =
  | "GROUP_REQUIRED"
  | "FROM_REQUIRED"
  | "TO_REQUIRED"
  | "PAIR_SAME"
  | "AMOUNT_REQUIRED"
  | "AMOUNT_INVALID"
  | "AMOUNT_TOO_HIGH"
  | "CURRENCY_INVALID"
  | "DATE_INVALID"
  | "DATE_IN_FUTURE"
  | "NOTE_TOO_LONG"
  | "CATEGORY_REQUIRED"
  | "WALLET_NOT_OWNED";

export interface GroupSettlementValidationIssue {
  field: GroupSettlementFormField;
  code: GroupSettlementValidationCode;
}

export type GroupSettlementFieldErrors = Partial<
  Record<GroupSettlementFormField, GroupSettlementValidationCode>
>;
