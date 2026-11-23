import {
  toGroupSettlementFieldErrors,
  type GroupSettlementFieldErrors,
  type GroupSettlementValidationIssue,
} from "../schemas/group-settlement.schema";
import {
  getGroupExpenseErrorCode,
  type GroupExpenseErrorCode,
} from "./group-expense.errors";

/**
 * Field-level failure of the settlement form. It mirrors
 * `GroupExpenseValidationError` so the UI keeps one error shape and translates
 * `fieldErrors[field]` codes.
 */
export class GroupSettlementValidationError extends Error {
  readonly issues: GroupSettlementValidationIssue[];
  readonly fieldErrors: GroupSettlementFieldErrors;

  constructor(issues: GroupSettlementValidationIssue[]) {
    super(issues[0]?.code ?? "VALIDATION");
    this.name = "GroupSettlementValidationError";
    this.issues = issues;
    this.fieldErrors = toGroupSettlementFieldErrors(issues);
  }
}

/**
 * The settlement codes live in `GroupExpenseOperationError` so both features
 * share one union and one mapper. A settlement failure therefore reaches the UI
 * through the same stable codes as a group expense.
 */
export type GroupSettlementOperationCode =
  | "SETTLEMENT_NOT_FOUND"
  | "NOT_SETTLEMENT_PARTICIPANT"
  | "NO_DEBT"
  | "DIRECTION_MISMATCH"
  | "AMOUNT_EXCEEDS_DEBT"
  | "AMOUNT_LOCKED"
  | "SETTLEMENT_HAS_RECEIVER_MOVEMENT"
  | "WALLET_NOT_FOUND"
  | "WALLET_NOT_OWNED"
  | "CURRENCY_MISMATCH"
  | "WALLET_ARCHIVED"
  | "CATEGORY_REQUIRED"
  | "ALREADY_DELETED"
  | "NOT_GROUP_MEMBER"
  | "GROUP_NOT_FOUND"
  | "SIGN_IN_REQUIRED";

/** Re-exported alias so the UI phase imports only from the settlement module. */
export function getGroupSettlementErrorCode(
  error: unknown,
  fallback: GroupExpenseErrorCode = "LOAD_FAILED",
): GroupExpenseErrorCode {
  // The field error is settlement-only; the shared mapper knows the operation
  // codes, the permission and network branches.
  if (error instanceof GroupSettlementValidationError) return "VALIDATION";

  return getGroupExpenseErrorCode(error, fallback);
}
