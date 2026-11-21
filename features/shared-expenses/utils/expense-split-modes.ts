import type {
  SplitParticipantInput,
  SplitResult,
} from "../types/shared-expense.types";
import { distributeByRemainder } from "./expense-remainder";

const BPS_TOTAL = 10000;

function isNonNegativeInteger(value: number): boolean {
  return Number.isInteger(value) && value >= 0;
}

/**
 * Trims the uids, rejects repeated ones and requires `minParticipants` rows.
 * The 1:1 form keeps the default of two; a group expense may invoice a single
 * member when the payer pays for others and is excluded from `participants`.
 */
export function normalizeParticipants(
  participants: readonly SplitParticipantInput[],
  minParticipants = 2,
): SplitParticipantInput[] | null {
  const minimum = minParticipants > 1 ? Math.trunc(minParticipants) : 1;

  if (participants.length < minimum) return null;

  const seen = new Set<string>();

  for (const participant of participants) {
    const userId =
      typeof participant.userId === "string" ? participant.userId.trim() : "";

    if (userId.length === 0 || seen.has(userId)) return null;

    seen.add(userId);
  }

  return participants.map((participant) => ({
    userId: participant.userId.trim(),
    value: participant.value,
  }));
}

export function splitEqual(
  totalCents: number,
  participants: readonly SplitParticipantInput[],
): SplitResult {
  const count = participants.length;

  return {
    ok: true,
    value: distributeByRemainder(
      totalCents,
      participants.map((participant) => ({
        userId: participant.userId,
        floorCents: Math.floor(totalCents / count),
        remainder: totalCents % count,
      })),
    ),
  };
}

export function splitPercentage(
  totalCents: number,
  participants: readonly SplitParticipantInput[],
): SplitResult {
  const isValid = participants.every(
    (participant) =>
      Number.isInteger(participant.value) &&
      participant.value >= 0 &&
      participant.value <= BPS_TOTAL,
  );
  if (!isValid) return { ok: false, error: "INVALID_PERCENTAGE" };

  const totalBps = participants.reduce((sum, item) => sum + item.value, 0);
  if (totalBps !== BPS_TOTAL) {
    return { ok: false, error: "PERCENTAGE_SUM_MISMATCH" };
  }

  return {
    ok: true,
    value: distributeByRemainder(
      totalCents,
      participants.map((participant) => {
        const scaled = totalCents * participant.value;

        return {
          userId: participant.userId,
          floorCents: Math.floor(scaled / BPS_TOTAL),
          remainder: scaled % BPS_TOTAL,
          percentageBps: participant.value,
        };
      }),
    ),
  };
}

export function splitFixed(
  totalCents: number,
  participants: readonly SplitParticipantInput[],
): SplitResult {
  if (!participants.every((item) => isNonNegativeInteger(item.value))) {
    return { ok: false, error: "INVALID_FIXED_AMOUNT" };
  }

  const total = participants.reduce((sum, item) => sum + item.value, 0);
  if (total !== totalCents) return { ok: false, error: "FIXED_SUM_MISMATCH" };

  return {
    ok: true,
    value: distributeByRemainder(
      totalCents,
      participants.map((participant) => ({
        userId: participant.userId,
        floorCents: participant.value,
        remainder: 0,
      })),
    ),
  };
}

export function splitShares(
  totalCents: number,
  participants: readonly SplitParticipantInput[],
): SplitResult {
  if (!participants.every((item) => isNonNegativeInteger(item.value))) {
    return { ok: false, error: "INVALID_SHARES" };
  }

  const totalWeight = participants.reduce((sum, item) => sum + item.value, 0);
  if (totalWeight <= 0) return { ok: false, error: "SHARES_SUM_INVALID" };

  return {
    ok: true,
    value: distributeByRemainder(
      totalCents,
      participants.map((participant) => {
        const scaled = totalCents * participant.value;

        return {
          userId: participant.userId,
          floorCents: Math.floor(scaled / totalWeight),
          remainder: scaled % totalWeight,
          weight: participant.value,
        };
      }),
    ),
  };
}
