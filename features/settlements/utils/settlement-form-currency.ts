import type { CurrencyCode } from "@/shared/constants/currencies";
import type { FriendBalance } from "@/features/friends/types/friend.types";

import type { Settlement } from "../types/settlement.types";
import { getSettlementDirection } from "./settlement-debt";
import type { SettlementCurrencyOption } from "./settlement-form.types";

function toCents(value: number): number {
  return Number.isFinite(value) ? Math.round(value) : 0;
}

/** `12.34` for the amount input; the parser accepts the comma too. */
export function formatSettlementAmountInput(cents: number): string {
  return (toCents(cents) / 100).toFixed(2);
}

/**
 * Only currencies with a real debt can be settled. The order follows
 * `Friend.balances[]` (EUR first) so the default does not depend on the device.
 */
export function getSettlementCurrencyOptions(
  balances: readonly FriendBalance[],
): SettlementCurrencyOption[] {
  return balances
    .filter((balance) => balance.netBalanceCents !== 0)
    .map((balance) => ({
      currency: balance.currency,
      netBalanceCents: balance.netBalanceCents,
      debtCents: Math.abs(toCents(balance.netBalanceCents)),
      direction:
        getSettlementDirection(balance.netBalanceCents) === "friend-owes-viewer"
          ? "friend-owes-viewer"
          : "viewer-owes-friend",
    }));
}

export function getSettlementCurrencyOption(
  options: readonly SettlementCurrencyOption[],
  currency: CurrencyCode,
): SettlementCurrencyOption | null {
  return options.find((option) => option.currency === currency) ?? null;
}

/** True when the viewer receives the money in that currency. */
export function viewerIsCreditorFor(
  option: SettlementCurrencyOption | null,
): boolean {
  return option?.direction === "friend-owes-viewer";
}

/**
 * Current net excluding one settlement, which is what an edit must respect.
 * The settlement already reduced the debt, so add it back on the receiver side
 * and subtract it on the payer side before validating a new amount.
 */
export function getSettlementEditableNetCents(
  settlement: Settlement,
  viewerUid: string,
  currentNetCents: number,
): number {
  const amount = toCents(settlement.amountCents);

  return settlement.fromUserId === viewerUid
    ? currentNetCents - amount
    : currentNetCents + amount;
}
