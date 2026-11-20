import { CURRENCIES, DEFAULT_CURRENCY } from "@/shared/constants/currencies";

/** `CURRENCIES` entry of the default currency, used as the safe fallback. */
const DEFAULT_CURRENCY_OPTION =
  CURRENCIES.find((currency) => currency.code === DEFAULT_CURRENCY) ??
  CURRENCIES[0];

/**
 * Compact display label of a currency: `code + symbol` (`EUR €`). An unknown
 * but non-empty string keeps its code so a stored legacy value is visible, and
 * a missing value falls back to the default currency; it never throws.
 */
export function formatCurrencyLabel(value: unknown): string {
  const code = typeof value === "string" ? value.trim() : "";
  const known = CURRENCIES.find((currency) => currency.code === code);

  if (known) return `${known.code} ${known.symbol}`;
  if (code.length > 0) return code;

  return `${DEFAULT_CURRENCY_OPTION.code} ${DEFAULT_CURRENCY_OPTION.symbol}`;
}
