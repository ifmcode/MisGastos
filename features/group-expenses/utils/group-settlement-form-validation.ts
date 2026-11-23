import { getTodayIsoDate, parseDateInput } from "@/shared/utils/date";

import { amountToCents } from "@/features/shared-expenses/utils/expense-amount";

import type { GroupSettlementFormValues } from "./group-settlement-form.types";

function toCents(value: number): number {
  return Number.isFinite(value) ? Math.round(value) : 0;
}

/**
 * Amount issue the form can detect without the ledger: an empty, malformed or
 * zero amount, or one above the pair debt. Zero is rejected because a
 * settlement records money that already moved.
 */
export function getGroupSettlementAmountIssue(
  values: GroupSettlementFormValues,
  debtCents: number,
): "AMOUNT_REQUIRED" | "AMOUNT_INVALID" | "AMOUNT_EXCEEDS_DEBT" | null {
  const trimmed = values.amount.trim();
  if (trimmed.length === 0) return "AMOUNT_REQUIRED";

  const cents = amountToCents(trimmed);
  if (cents === null || cents <= 0) return "AMOUNT_INVALID";
  if (cents > toCents(debtCents)) return "AMOUNT_EXCEEDS_DEBT";

  return null;
}

/** A settlement dates money that already moved: today and past days only. */
export function getGroupSettlementDateIssue(
  values: GroupSettlementFormValues,
  today: string = getTodayIsoDate(),
): "DATE_INVALID" | "DATE_IN_FUTURE" | null {
  const date = parseDateInput(values.date.trim());

  if (date === null) return "DATE_INVALID";
  if (today.length > 0 && date > today) return "DATE_IN_FUTURE";

  return null;
}
