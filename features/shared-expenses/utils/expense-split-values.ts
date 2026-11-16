import type { Result } from "@/shared/types/common.types";

import type {
  ExpenseSplitMode,
  SharedExpenseParticipantInput,
  SplitParticipantInput,
} from "../types/shared-expense.types";
import { parseCentsAmount } from "./expense-amount";

export type SplitValueErrorCode =
  | "PARTICIPANTS_INVALID"
  | "INVALID_PERCENTAGE"
  | "INVALID_FIXED_AMOUNT"
  | "INVALID_SHARES";

const PERCENT_PATTERN = /^\d{1,3}(?:[.,]\d{1,2})?$/;
const WEIGHT_PATTERN = /^\d{1,6}$/;
const BPS_FACTOR = 100;
const BPS_MAX = 10000;

const INVALID_VALUE_CODE: Record<ExpenseSplitMode, SplitValueErrorCode> = {
  equal: "PARTICIPANTS_INVALID",
  percentage: "INVALID_PERCENTAGE",
  fixed: "INVALID_FIXED_AMOUNT",
  shares: "INVALID_SHARES",
};

function readDecimalText(value: unknown): string {
  return typeof value === "string" ? value.trim().replace(",", ".") : "";
}

/** Percent with at most 2 decimals (max 2 decimals of a percent) as basis points. */
function parsePercentageBps(value: unknown): number | null {
  const normalized = readDecimalText(value);
  if (!PERCENT_PATTERN.test(normalized)) return null;

  const bps = Math.round(Number(normalized) * BPS_FACTOR);
  return bps >= 0 && bps <= BPS_MAX ? bps : null;
}

function parseWeight(value: unknown): number | null {
  const normalized = readDecimalText(value);
  if (!WEIGHT_PATTERN.test(normalized)) return null;

  return Number(normalized);
}

/** Parses the raw participant `value` for the mode. `equal` ignores it. */
export function parseSplitValue(
  mode: ExpenseSplitMode,
  value: unknown,
): number | null {
  if (mode === "percentage") return parsePercentageBps(value);
  if (mode === "fixed") return parseCentsAmount(value, true);
  if (mode === "shares") return parseWeight(value);

  return 0;
}

/**
 * Turns every raw participant row into the numeric row the split needs,
 * trimming the uids and reporting the mode-specific parse failure code.
 */
export function parseSplitParticipants(
  mode: ExpenseSplitMode,
  participants: readonly SharedExpenseParticipantInput[],
): Result<SplitParticipantInput[], SplitValueErrorCode> {
  if (participants.length === 0) {
    return { ok: false, error: "PARTICIPANTS_INVALID" };
  }

  const parsed: SplitParticipantInput[] = [];

  for (const participant of participants) {
    const userId =
      typeof participant.userId === "string" ? participant.userId.trim() : "";

    if (userId.length === 0) {
      return { ok: false, error: "PARTICIPANTS_INVALID" };
    }

    const value = parseSplitValue(mode, participant.value);

    if (value === null) {
      return { ok: false, error: INVALID_VALUE_CODE[mode] };
    }

    parsed.push({ userId, value });
  }

  return { ok: true, value: parsed };
}
