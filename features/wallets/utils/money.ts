import {
  CURRENCIES,
  CurrencyCode,
} from "@/shared/constants/currencies";

import { Wallet } from "../types/wallet.types";

const THOUSANDS_SEPARATOR = ".";

/**
 * Money is stored as a decimal number rounded to 2 decimals. Every
 * calculation goes through this helper to avoid float drift.
 */
export function roundMoney(value: number): number {
  if (!Number.isFinite(value)) return 0;

  const sign = value < 0 ? -1 : 1;
  const absolute = Math.abs(value);
  const tolerance = Number.EPSILON * Math.max(1, absolute);
  const rounded = Math.round((absolute + tolerance) * 100) / 100;

  return sign * rounded;
}

export function getCurrencySymbol(currency: CurrencyCode): string {
  return (
    CURRENCIES.find((item) => item.code === currency)?.symbol ?? currency
  );
}

function formatDecimal(value: number): string {
  const normalized = Number.isFinite(value) ? roundMoney(value) : 0;
  const absolute = Math.abs(normalized).toFixed(2);
  const [integerPart, decimalPart] = absolute.split(".");
  const groupedInteger = integerPart.replace(
    /\B(?=(\d{3})+(?!\d))/g,
    THOUSANDS_SEPARATOR,
  );

  return `${normalized < 0 ? "-" : ""}${groupedInteger},${decimalPart}`;
}

export function formatMoney(amount: number, currency: CurrencyCode): string {
  return `${formatDecimal(amount)} ${getCurrencySymbol(currency)}`;
}

export function calculateWalletBalance(
  initialBalance: number,
  movements = 0,
): number {
  return roundMoney(initialBalance + movements);
}

export interface WalletTotal {
  currency: CurrencyCode;
  total: number;
}

/**
 * Sums only wallets marked as included in the dashboard total. Totals are
 * grouped by currency because MVP does not support currency conversion.
 */
export function calculateWalletTotals(
  wallets: readonly Wallet[],
): WalletTotal[] {
  const totals = new Map<CurrencyCode, number>();

  for (const wallet of wallets) {
    if (!wallet.includeInTotal) continue;

    const current = totals.get(wallet.currency) ?? 0;
    totals.set(wallet.currency, roundMoney(current + wallet.balance));
  }

  return Array.from(totals.entries())
    .map(([currency, total]) => ({ currency, total }))
    .sort((left, right) => {
      const leftPriority = left.currency === "EUR" ? 0 : 1;
      const rightPriority = right.currency === "EUR" ? 0 : 1;

      if (leftPriority !== rightPriority) {
        return leftPriority - rightPriority;
      }

      return left.currency.localeCompare(right.currency);
    });
}
