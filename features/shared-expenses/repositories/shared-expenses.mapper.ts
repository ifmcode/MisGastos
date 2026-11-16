import { isCurrencyCode } from "@/shared/constants/currencies";
import {
  createFriendPairId,
  isValidFriendPair,
} from "@/features/friends/utils/friend-pair";

import type {
  SharedExpense,
  SharedExpenseParticipant,
} from "../types/shared-expense.types";
import { isExpenseSplitMode } from "../utils/expense-split";

const PARTICIPANT_COUNT = 2;

function readText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function readTextOrNull(value: unknown): string | null {
  const text = readText(value);
  return text.length > 0 ? text : null;
}

function readStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => readText(item))
    .filter((item) => item.length > 0);
}

function readInteger(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) ? value : null;
}

function readOptionalInteger(value: unknown): number | undefined {
  return typeof value === "number" && Number.isInteger(value)
    ? value
    : undefined;
}

function readParticipant(value: unknown): SharedExpenseParticipant | null {
  if (typeof value !== "object" || value === null) return null;

  const row = value as Record<string, unknown>;
  const userId = readText(row.userId);
  const shareCents = readInteger(row.shareCents);

  if (userId.length === 0 || shareCents === null || shareCents < 0) {
    return null;
  }

  return {
    userId,
    shareCents,
    percentageBps: readOptionalInteger(row.percentageBps),
    weight: readOptionalInteger(row.weight),
  };
}

/** The 1:1 document stores exactly two usable rows, both inside the pair. */
function readParticipants(
  value: unknown,
  participantIds: readonly string[],
): SharedExpenseParticipant[] | null {
  if (!Array.isArray(value)) return null;

  const participants: SharedExpenseParticipant[] = [];

  for (const row of value) {
    const participant = readParticipant(row);
    if (participant) participants.push(participant);
  }

  if (participants.length !== PARTICIPANT_COUNT) return null;
  if (participants[0].userId === participants[1].userId) return null;

  const belongsToPair = participants.every((participant) =>
    participantIds.includes(participant.userId),
  );

  return belongsToPair ? participants : null;
}

/**
 * Converts a `sharedExpenses` document. Malformed records are dropped (null)
 * instead of breaking the list: a missing id, an unsorted or incomplete pair, a
 * `pairId` that disagrees with the pair, an unknown payer, a non-positive or
 * non-integer amount, an invalid currency or split mode, or a participant list
 * without two usable rows. The sum of shares is validated by the schema, never
 * here, because rules cannot sum lists either.
 */
export function mapSharedExpenseDocument(
  id: string,
  data: Record<string, unknown>,
): SharedExpense | null {
  const expenseId = readText(id);
  if (expenseId.length === 0) return null;

  const participantIds = readStringArray(data.participantIds);
  if (!isValidFriendPair(participantIds)) return null;

  const pairId = createFriendPairId(participantIds[0], participantIds[1]);
  const storedPairId = readText(data.pairId);
  if (storedPairId.length > 0 && storedPairId !== pairId) return null;

  const payerId = readText(data.payerId);
  if (!participantIds.includes(payerId)) return null;

  const amountCents = readInteger(data.amountCents);
  if (amountCents === null || amountCents <= 0) return null;

  const currency = data.currency;
  if (!isCurrencyCode(currency)) return null;

  const splitMode = data.splitMode;
  if (!isExpenseSplitMode(splitMode)) return null;

  const participants = readParticipants(data.participants, participantIds);
  if (participants === null) return null;

  return {
    id: expenseId,
    pairId,
    participantIds,
    payerId,
    amountCents,
    currency,
    splitMode,
    participants,
    description: readText(data.description),
    date: readText(data.date),
    walletId: readTextOrNull(data.walletId),
    categoryId: readTextOrNull(data.categoryId),
    linkedTransactionId: readTextOrNull(data.linkedTransactionId),
    createdBy: readText(data.createdBy),
    createdAt: readText(data.createdAt),
    updatedAt: readText(data.updatedAt),
    deletedAt: readTextOrNull(data.deletedAt),
  };
}
