import type { CurrencyCode } from "@/shared/constants/currencies";

import type { GroupDebt } from "../types/group-balance.types";

/** Integer cents only: a malformed stored value settles at 0, never NaN. */
export function toCents(value: number): number {
  return Number.isFinite(value) ? Math.round(value) : 0;
}

/** EUR first (the default), then the code ascending: locale independent. */
export function compareGroupCurrencies(
  left: CurrencyCode,
  right: CurrencyCode,
): number {
  if (left === right) return 0;
  if (left === "EUR") return -1;
  if (right === "EUR") return 1;

  return left < right ? -1 : 1;
}

/** Code-point order, never `localeCompare`: same output on every device. */
export function compareGroupText(left: string, right: string): number {
  if (left === right) return 0;

  return left < right ? -1 : 1;
}

/** Currency EUR-first, then `fromUserId`, then `toUserId`: stable output. */
export function sortGroupDebts(debts: GroupDebt[]): GroupDebt[] {
  return debts.sort((left, right) => {
    const currency = compareGroupCurrencies(left.currency, right.currency);
    if (currency !== 0) return currency;

    const from = compareGroupText(left.fromUserId, right.fromUserId);
    if (from !== 0) return from;

    return compareGroupText(left.toUserId, right.toUserId);
  });
}
