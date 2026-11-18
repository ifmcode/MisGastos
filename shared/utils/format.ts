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

const SECOND_MS = 1000;
const MINUTE_MS = 60 * SECOND_MS;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
/** Averages enough for the month bucket; the copy never shows days past it. */
const MONTH_MS = 30 * DAY_MS;

function resolveRelativeUnit(absMs: number): {
  unit: Intl.RelativeTimeFormatUnit;
  sizeMs: number;
} {
  if (absMs < MINUTE_MS) return { unit: "second", sizeMs: SECOND_MS };
  if (absMs < HOUR_MS) return { unit: "minute", sizeMs: MINUTE_MS };
  if (absMs < DAY_MS) return { unit: "hour", sizeMs: HOUR_MS };
  if (absMs < MONTH_MS) return { unit: "day", sizeMs: DAY_MS };

  return { unit: "month", sizeMs: MONTH_MS };
}

/**
 * Relative date such as "hace 5 minutos" / "5 minutes ago". `now` is injectable
 * so callers and tests stay deterministic. An unparseable value returns
 * `String(value)` and a missing `Intl.RelativeTimeFormat` degrades to the
 * absolute `formatDateTime` copy instead of throwing.
 */
export function formatRelativeTime(
  value: Date | string,
  locale: string,
  now: Date = new Date(),
): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  const elapsedMs = date.getTime() - now.getTime();
  const { unit, sizeMs } = resolveRelativeUnit(Math.abs(elapsedMs));

  try {
    return new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(
      Math.round(elapsedMs / sizeMs),
      unit,
    );
  } catch {
    return formatDateTime(date, locale);
  }
}
