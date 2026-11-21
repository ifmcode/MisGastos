import { amountToCents } from "@/features/shared-expenses/utils/expense-amount";

export type SettlementAmountStatus = "remaining" | "settled" | "exceeds";

export interface SettlementAmountState {
  status: SettlementAmountStatus;
  /** Debt left after the typed amount, never negative. */
  remainingCents: number;
}

/**
 * Live state of the typed amount against the outstanding debt. The parse goes
 * through `amountToCents`, so the message and the submit path agree. Empty,
 * unparseable or zero amounts, and a non-finite debt, have nothing to compare.
 */
export function getSettlementAmountState(
  amountText: string,
  debtCents: number,
): SettlementAmountState | null {
  if (!Number.isFinite(debtCents)) return null;

  const cents = amountToCents(amountText.trim());
  if (cents === null) return null;

  const debt = Math.round(debtCents);

  return {
    status: cents < debt ? "remaining" : cents === debt ? "settled" : "exceeds",
    remainingCents: Math.max(debt - cents, 0),
  };
}
