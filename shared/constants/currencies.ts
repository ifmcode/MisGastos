export const CURRENCIES = [
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "CHF", symbol: "Fr", name: "Swiss Franc" },
] as const;

export type CurrencyCode = (typeof CURRENCIES)[number]["code"];

export const DEFAULT_CURRENCY: CurrencyCode = "EUR";

export function isCurrencyCode(value: unknown): value is CurrencyCode {
  return (
    typeof value === "string" &&
    CURRENCIES.some((currency) => currency.code === value)
  );
}

/** Falls back to the project default when a stored or missing currency is invalid. */
export function resolveCurrencyCode(value: unknown): CurrencyCode {
  return isCurrencyCode(value) ? value : DEFAULT_CURRENCY;
}
