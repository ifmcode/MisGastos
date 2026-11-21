import {
  EXPENSE_SPLIT_MODES,
  type ExpenseSplitMode,
  type SplitParticipantInput,
  type SplitResult,
} from "../types/shared-expense.types";
import {
  normalizeParticipants,
  splitEqual,
  splitFixed,
  splitPercentage,
  splitShares,
} from "./expense-split-modes";

export function isExpenseSplitMode(value: unknown): value is ExpenseSplitMode {
  return EXPENSE_SPLIT_MODES.some((mode) => mode === value);
}

/**
 * Group-only opt-in: a group expense may invoice a single participant because
 * the payer can be excluded from `participants` (pays for others). The 1:1
 * default stays at two, so no existing caller changes behaviour.
 */
export interface SplitOptions {
  minParticipants?: number;
}

/**
 * Split entry point shared by the 1:1 form and the group form. It works only in
 * integer cents, so the caller converts once at the boundary. The returned
 * shares are ordered by `userId`, so the form order never leaks into the stored
 * document.
 */
export function splitExpenseAmount(
  totalCents: number,
  mode: ExpenseSplitMode,
  participants: readonly SplitParticipantInput[],
  options: SplitOptions = {},
): SplitResult {
  if (!Number.isInteger(totalCents) || totalCents <= 0) {
    return { ok: false, error: "INVALID_TOTAL" };
  }

  const normalized = normalizeParticipants(
    participants,
    options.minParticipants ?? 2,
  );
  if (normalized === null) return { ok: false, error: "INVALID_PARTICIPANTS" };

  switch (mode) {
    case "percentage":
      return splitPercentage(totalCents, normalized);
    case "fixed":
      return splitFixed(totalCents, normalized);
    case "shares":
      return splitShares(totalCents, normalized);
    case "equal":
      return splitEqual(totalCents, normalized);
    default:
      // Unknown mode: the schema rejects it first with SPLIT_MODE_INVALID.
      return { ok: false, error: "INVALID_PARTICIPANTS" };
  }
}
