import type { CurrencyCode } from "@/shared/constants/currencies";
import { parseIsoDateToLocalDate } from "@/shared/utils/date";

function safeNumber(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

export function formatCurrency(
  value: number,
  currency: CurrencyCode,
  locale: string,
): string {
  const safe = safeNumber(value);

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
    }).format(safe);
  } catch {
    return `${safe.toFixed(2)} ${currency}`;
  }
}

export function formatNumber(
  value: number,
  locale: string,
  options: Intl.NumberFormatOptions = {},
): string {
  try {
    return new Intl.NumberFormat(locale, options).format(safeNumber(value));
  } catch {
    return String(safeNumber(value));
  }
}

export function formatPercent(
  value: number,
  locale: string,
  options: Intl.NumberFormatOptions = {},
): string {
  return formatNumber(value, locale, { style: "percent", ...options });
}

export function formatDate(
  isoDate: string,
  locale: string,
  options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  },
): string {
  const date = parseIsoDateToLocalDate(isoDate);
  if (!date) return isoDate;

  try {
    return new Intl.DateTimeFormat(locale, options).format(date);
  } catch {
    return isoDate;
  }
}

export function formatDateTime(
  value: Date | string,
  locale: string,
  options: Intl.DateTimeFormatOptions = {
    dateStyle: "medium",
    timeStyle: "short",
  },
): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  try {
    return new Intl.DateTimeFormat(locale, options).format(date);
  } catch {
    return date.toISOString();
  }
}
