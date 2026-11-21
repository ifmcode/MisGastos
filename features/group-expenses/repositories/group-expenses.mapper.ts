import { isCurrencyCode } from "@/shared/constants/currencies";
import { parseDateInput } from "@/shared/utils/date";

import { isExpenseSplitMode } from "@/features/shared-expenses/utils/expense-split";

import {
  GROUP_EXPENSE_AMOUNT_MAX_CENTS,
  GROUP_EXPENSE_DESCRIPTION_MAX_LENGTH,
  GROUP_EXPENSE_MAX_PARTICIPANTS,
  type GroupExpense,
  type SharedExpenseParticipant,
} from "../types/group-expense.types";

function readText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function readTextOrNull(value: unknown): string | null {
  const text = readText(value);
  return text.length > 0 ? text : null;
}

function readInteger(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) ? value : null;
}

function readParticipant(value: unknown): SharedExpenseParticipant | null {
  if (typeof value !== "object" || value === null) return null;

  const row = value as Record<string, unknown>;
  const userId = readText(row.userId);
  const shareCents = readInteger(row.shareCents);

  if (
    userId.length === 0 ||
    shareCents === null ||
    shareCents < 0 ||
    shareCents > GROUP_EXPENSE_AMOUNT_MAX_CENTS
  ) {
    return null;
  }

  return {
    userId,
    shareCents,
    percentageBps: readInteger(row.percentageBps) ?? undefined,
    weight: readInteger(row.weight) ?? undefined,
  };
}

/** 1..20 unique, usable rows; the share sum stays in the schema, not here. */
function readParticipants(
  value: unknown,
): SharedExpenseParticipant[] | null {
  if (!Array.isArray(value)) return null;
  if (value.length < 1 || value.length > GROUP_EXPENSE_MAX_PARTICIPANTS) {
    return null;
  }

  const participants: SharedExpenseParticipant[] = [];

  for (const row of value) {
    const participant = readParticipant(row);
    if (!participant) return null;
    if (participants.some((item) => item.userId === participant.userId)) {
      return null;
    }

    participants.push(participant);
  }

  return participants;
}

/**
 * Converts a `groupExpenses` document. Malformed records are dropped (null)
 * instead of breaking the list: a missing id, group, payer or creation stamp, a
 * non-positive or non-integer amount, an invalid currency or split mode, a
 * participant list outside 1..20 rows with unique non-negative shares, an empty
 * or oversized description and an unparseable date.
 *
 * Membership of `groupId`, `payerId` and every participant is NOT checked here
 * (it needs a group read): the service owns it and the rules prove the caller.
 * The share sum stays in the schema.
 */
export function mapGroupExpenseDocument(
  id: string,
  data: Record<string, unknown>,
): GroupExpense | null {
  const expenseId = readText(id);
  if (expenseId.length === 0) return null;

  const groupId = readText(data.groupId);
  if (groupId.length === 0) return null;

  const payerId = readText(data.payerId);
  if (payerId.length === 0) return null;

  const amountCents = readInteger(data.amountCents);
  if (
    amountCents === null ||
    amountCents <= 0 ||
    amountCents > GROUP_EXPENSE_AMOUNT_MAX_CENTS
  ) {
    return null;
  }

  const currency = data.currency;
  if (!isCurrencyCode(currency)) return null;

  const splitMode = data.splitMode;
  if (!isExpenseSplitMode(splitMode)) return null;

  const participants = readParticipants(data.participants);
  if (participants === null) return null;

  const description = readText(data.description);
  if (
    description.length === 0 ||
    description.length > GROUP_EXPENSE_DESCRIPTION_MAX_LENGTH
  ) {
    return null;
  }

  const date = parseDateInput(readText(data.date));
  if (date === null) return null;

  const createdBy = readText(data.createdBy);
  const createdAt = readText(data.createdAt);
  if (createdBy.length === 0 || createdAt.length === 0) return null;

  return {
    id: expenseId,
    groupId,
    payerId,
    amountCents,
    currency,
    splitMode,
    participants,
    description,
    date,
    createdBy,
    createdAt,
    updatedAt: readText(data.updatedAt),
    deletedAt: readTextOrNull(data.deletedAt),
  };
}
