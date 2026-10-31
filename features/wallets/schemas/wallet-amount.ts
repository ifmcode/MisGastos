import { roundMoney } from "../utils/money";
import { WALLET_MAX_AMOUNT } from "./wallet-validation.types";

const AMOUNT_PATTERN = /^\d{1,12}(?:\.\d{1,2})?$/;

/**
 * Parses a user-entered amount. An empty value means 0 (initial balance is
 * optional), commas are accepted as decimal separators and at most 2 decimals
 * are allowed. Negative values are rejected.
 */
export function parseAmountInput(value: string | number): number | null {
  if (typeof value === "number") {
    if (!Number.isFinite(value) || value < 0) return null;
    if (value > WALLET_MAX_AMOUNT) return null;
    return roundMoney(value);
  }

  if (typeof value !== "string") return null;

  const normalized = value.trim();
  if (normalized === "") return 0;

  const withDot = normalized.replace(",", ".");
  if (!AMOUNT_PATTERN.test(withDot)) return null;

  const parsed = Number(withDot);
  if (!Number.isFinite(parsed) || parsed > WALLET_MAX_AMOUNT) return null;

  return roundMoney(parsed);
}
