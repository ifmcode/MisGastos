import type { CurrencyCode } from "@/shared/constants/currencies";
import { formatCurrency } from "@/shared/utils/format";

import { amountToCents, centsToAmount, parseCentsAmount } from "./expense-amount";

export type FixedSplitState = "partial" | "complete" | "over";

export interface FixedSplitRemaining {
  totalCents: number;
  assignedCents: number;
  missingCents: number;
  excessCents: number;
  state: FixedSplitState;
}

function readCents(value: string): number {
  // An empty or unparseable row is simply nothing assigned yet; the schema
  // still rejects it at save time with INVALID_FIXED_AMOUNT.
  return parseCentsAmount(value, true) ?? 0;
}

/**
 * Live state of the fixed split, derived from the raw typed strings. It only
 * informs: `FIXED_SUM_MISMATCH`/`INVALID_FIXED_AMOUNT` remain the save rules.
 */
export function getFixedSplitRemaining(
  amountText: string,
  participantValues: readonly string[],
): FixedSplitRemaining {
  const totalCents = amountToCents(amountText) ?? 0;
  const assignedCents = participantValues.reduce(
    (sum, value) => sum + readCents(value),
    0,
  );
  const missingCents = Math.max(totalCents - assignedCents, 0);
  const excessCents = Math.max(assignedCents - totalCents, 0);
  const state: FixedSplitState =
    excessCents > 0 ? "over" : missingCents > 0 ? "partial" : "complete";

  return { totalCents, assignedCents, missingCents, excessCents, state };
}

/**
 * Integer cents rendered with the app locale and currency. The cents are
 * converted once and `formatCurrency` owns the rounding at the render boundary.
 */
export function formatRemainingCents(
  cents: number,
  currency: CurrencyCode,
  locale: string,
): string {
  const safe = Number.isFinite(cents) ? Math.round(cents) : 0;

  return formatCurrency(centsToAmount(safe), currency, locale);
}
