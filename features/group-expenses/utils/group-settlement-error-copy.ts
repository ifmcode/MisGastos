import type { GroupExpenseErrorCode } from "../services/group-expense.errors";

/**
 * Copy keys of the codes shared with the group-expense flow. A settlement
 * failure must never read like a failed expense, so the generic save/load/
 * delete fallbacks and the soft-delete code get settlement-specific copy.
 */
const SETTLEMENT_ERROR_COPY_KEYS: Partial<Record<GroupExpenseErrorCode, string>> =
  {
    LOAD_FAILED: "SETTLEMENT_LOAD_FAILED",
    SAVE_FAILED: "SETTLEMENT_SAVE_FAILED",
    DELETE_FAILED: "SETTLEMENT_DELETE_FAILED",
    ALREADY_DELETED: "SETTLEMENT_ALREADY_DELETED",
  };

/** `errors.<key>` inside the `groupExpenses` namespace. */
export function getGroupSettlementErrorCopyKey(
  code: GroupExpenseErrorCode,
): string {
  return SETTLEMENT_ERROR_COPY_KEYS[code] ?? code;
}
