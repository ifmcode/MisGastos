import type { ExpenseSplitMode } from "../types/shared-expense.types";
import { amountToCents } from "./expense-amount";
import { splitExpenseAmount } from "./expense-split";
import { parseSplitParticipants } from "./expense-split-values";

const BPS_TOTAL = 10000;

/** Integer cents rendered as the decimal text the amount inputs expect. */
export function formatCentsText(cents: number): string {
  const safe = Number.isFinite(cents) ? Math.round(cents) : 0;
  const absolute = Math.abs(safe);
  const units = Math.floor(absolute / 100);
  const decimals = String(absolute % 100).padStart(2, "0");

  return `${safe < 0 ? "-" : ""}${units}.${decimals}`;
}

/** Basis points rendered with two decimals only when the value needs them. */
export function formatBpsText(bps: number): string {
  const safe = Number.isFinite(bps) ? Math.round(bps) : 0;
  const units = Math.floor(safe / 100);
  const hundredths = safe % 100;

  if (hundredths === 0) return String(units);
  if (hundredths % 10 === 0) return `${units}.${hundredths / 10}`;

  return `${units}.${String(hundredths).padStart(2, "0")}`;
}

/** Even integer split plus the leftover, assigned to the first participants. */
function distribute(total: number, count: number): number[] {
  const safeTotal = Number.isFinite(total) ? Math.max(Math.round(total), 0) : 0;
  const base = Math.floor(safeTotal / count);
  const remainder = safeTotal % count;

  return Array.from(
    { length: count },
    (_, index) => base + (index < remainder ? 1 : 0),
  );
}

/**
 * Valid starting values for a split mode, derived from the current amount.
 * `equal` needs no participant values, so it returns an empty map.
 */
export function getDefaultSplitValues(
  mode: ExpenseSplitMode,
  amountText: string,
  participantIds: readonly string[],
): Record<string, string> {
  if (mode === "equal" || participantIds.length === 0) return {};

  if (mode === "shares") {
    return Object.fromEntries(participantIds.map((userId) => [userId, "1"]));
  }

  const total =
    mode === "percentage" ? BPS_TOTAL : (amountToCents(amountText) ?? 0);
  const values = distribute(total, participantIds.length);

  return Object.fromEntries(
    participantIds.map((userId, index) => [
      userId,
      mode === "percentage"
        ? formatBpsText(values[index])
        : formatCentsText(values[index]),
    ]),
  );
}

/**
 * True when the values stored for a mode still produce an exact split of the
 * current amount, so switching back never overwrites what the user typed.
 * `minParticipants` is forwarded to the split engine: the group form accepts a
 * single participant, the 1:1 form keeps the default of two.
 */
export function canReuseSplitValues(
  mode: ExpenseSplitMode,
  amountText: string,
  participantIds: readonly string[],
  values: Record<string, string>,
  minParticipants = 2,
): boolean {
  if (mode === "equal") return true;

  const parsed = parseSplitParticipants(
    mode,
    participantIds.map((userId) => ({ userId, value: values[userId] ?? "" })),
  );
  if (!parsed.ok) return false;

  const total = amountToCents(amountText);
  if (total === null) return false;

  return splitExpenseAmount(total, mode, parsed.value, { minParticipants }).ok;
}
