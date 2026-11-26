import { roundMoney } from "@/shared/utils/money";

const CENTS_FACTOR = 100;
const AMOUNT_INPUT_PATTERN = /^\d{1,9}(?:[.,]\d{1,2})?$/;

/**
 * Reads a number or a user-typed decimal with at most 2 decimals. Commas are
 * accepted as decimal separators and negative values are rejected.
 */
function readDecimal(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) && value >= 0 ? value : null;
  }

  if (typeof value !== "string") return null;

  const normalized = value.trim().replace(",", ".");
  if (!AMOUNT_INPUT_PATTERN.test(normalized)) return null;

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Decimal -> integer cents boundary of the feature. `roundMoney` absorbs float
 * drift before `Math.round`, so `0.29` never becomes 28 cents.
 * `allowZero` keeps 0 valid, which is needed by fixed-amount shares.
 */
export function parseCentsAmount(value: unknown, allowZero = false): number | null {
  const amount = readDecimal(value);
  if (amount === null) return null;

  const cents = Math.round(roundMoney(amount) * CENTS_FACTOR);

  return allowZero ? cents : cents > 0 ? cents : null;
}

/** Strict boundary for the expense total: zero and negatives are invalid. */
export function amountToCents(value: unknown): number | null {
  return parseCentsAmount(value, false);
}

/**
 * Integer cents -> decimal amount, the inverse boundary used when a shared
 * expense is written as a personal movement.
 */
export function centsToAmount(cents: number): number {
  if (!Number.isFinite(cents)) return 0;

  return roundMoney(cents / CENTS_FACTOR);
}
