import { isCurrencyCode, type CurrencyCode } from "@/shared/constants/currencies";

import {
  GROUP_ACTIVITY_CHANGED_FIELDS,
  GROUP_ACTIVITY_DESCRIPTION_MAX_LENGTH,
  GROUP_ACTIVITY_NAME_MAX_LENGTH,
  GROUP_ACTIVITY_TYPES,
  type GroupActivity,
  type GroupActivityChangedField,
  type GroupActivityType,
} from "../types/group-activity.types";

function readText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function readType(value: unknown): GroupActivityType | null {
  return GROUP_ACTIVITY_TYPES.includes(value as GroupActivityType)
    ? (value as GroupActivityType)
    : null;
}

/** `null` (or absent) is a missing payload; a present but invalid text fails. */
function readNullableText(
  value: unknown,
  maxLength: number,
): string | null | undefined {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") return undefined;

  const text = value.trim();
  if (text.length > maxLength) return undefined;

  return text.length > 0 ? text : null;
}

function readNullableId(value: unknown): string | null | undefined {
  return readNullableText(value, 1500);
}

function readAmountCents(value: unknown): number | null | undefined {
  if (value === null || value === undefined) return null;
  if (!Number.isInteger(value) || (value as number) <= 0) return undefined;
  if ((value as number) > 100_000_000) return undefined;

  return value as number;
}

function readCurrency(value: unknown): CurrencyCode | null | undefined {
  if (value === null || value === undefined) return null;

  return isCurrencyCode(value) ? value : undefined;
}

function readChangedFields(
  value: unknown,
): GroupActivityChangedField[] | null {
  if (value === null || value === undefined) return [];
  if (!Array.isArray(value)) return null;

  const items: unknown[] = value;

  return items.every((item) =>
    GROUP_ACTIVITY_CHANGED_FIELDS.includes(item as GroupActivityChangedField),
  )
    ? (items as GroupActivityChangedField[])
    : null;
}

/**
 * Converts a `groups/{groupId}/activity` document. A malformed row is dropped
 * (never partially displayed): the feed only shows events whose type, ids,
 * stamp and bounded payload can be trusted.
 */
export function mapGroupActivityDocument(
  id: string,
  data: Record<string, unknown>,
): GroupActivity | null {
  const activityId = readText(id);
  const type = readType(data.type);
  const groupId = readText(data.groupId);
  const actorId = readText(data.actorId);
  const createdAt = readText(data.createdAt);
  const targetUserId = readNullableId(data.targetUserId);
  const targetName = readNullableText(data.targetName, GROUP_ACTIVITY_NAME_MAX_LENGTH);
  const expenseId = readNullableId(data.expenseId);
  const settlementId = readNullableId(data.settlementId);
  const fromUserId = readNullableId(data.fromUserId);
  const toUserId = readNullableId(data.toUserId);
  const amountCents = readAmountCents(data.amountCents);
  const currency = readCurrency(data.currency);
  const description = readNullableText(
    data.description,
    GROUP_ACTIVITY_DESCRIPTION_MAX_LENGTH,
  );
  const changedFields = readChangedFields(data.changedFields);
  const previousOwnerId = readNullableId(data.previousOwnerId);
  const newOwnerId = readNullableId(data.newOwnerId);
  const simplifyDebts = data.simplifyDebts ?? null;

  if (activityId.length === 0 || type === null) return null;
  if (groupId.length === 0 || actorId.length === 0) return null;
  if (createdAt.length === 0) return null;
  if (targetUserId === undefined || targetName === undefined) return null;
  if (expenseId === undefined || settlementId === undefined) return null;
  if (fromUserId === undefined || toUserId === undefined) return null;
  if (amountCents === undefined || currency === undefined) return null;
  if (description === undefined) return null;
  if (changedFields === null) return null;
  if (previousOwnerId === undefined || newOwnerId === undefined) return null;
  if (simplifyDebts !== null && typeof simplifyDebts !== "boolean") return null;

  return {
    id: activityId,
    type,
    groupId,
    actorId,
    targetUserId,
    targetName,
    expenseId,
    settlementId,
    fromUserId,
    toUserId,
    amountCents,
    currency,
    description,
    changedFields,
    simplifyDebts,
    previousOwnerId,
    newOwnerId,
    createdAt,
  };
}
