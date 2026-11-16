import type { CurrencyCode } from "@/shared/constants/currencies";
import { formatDateInput } from "@/shared/utils/date";

import type {
  ExpenseSplitMode,
  SharedExpenseInput,
} from "../types/shared-expense.types";

export type SplitValueTexts = Record<string, string>;

/** Raw form state; every amount and split value stays as typed text. */
export interface SharedExpenseFormValues {
  viewerUid: string;
  friendUid: string;
  description: string;
  amount: string;
  currency: CurrencyCode;
  /** ISO date (`YYYY-MM-DD`); empty while the user types an invalid date. */
  date: string;
  /** Same date as typed (`DD/MM/YYYY`). */
  dateText: string;
  payerId: string;
  splitMode: ExpenseSplitMode;
  splitValues: Record<ExpenseSplitMode, SplitValueTexts>;
}

export interface SharedExpenseFormDefaults {
  viewerUid: string;
  friendUid: string;
  currency: CurrencyCode;
  date: string;
  payerId?: string;
}

/** One empty value map per mode so switching never reads stale entries. */
export function emptySplitValues(): Record<ExpenseSplitMode, SplitValueTexts> {
  return { equal: {}, percentage: {}, fixed: {}, shares: {} };
}

export function createSharedExpenseFormValues(
  defaults: SharedExpenseFormDefaults,
): SharedExpenseFormValues {
  return {
    viewerUid: defaults.viewerUid,
    friendUid: defaults.friendUid,
    description: "",
    amount: "",
    currency: defaults.currency,
    date: defaults.date,
    dateText: formatDateInput(defaults.date),
    payerId: defaults.payerId ?? defaults.viewerUid,
    splitMode: "equal",
    splitValues: emptySplitValues(),
  };
}

/** Viewer and friend, deduplicated: the only valid 1:1 participant pair. */
export function getSharedExpenseParticipantIds(
  values: SharedExpenseFormValues,
): string[] {
  const ids = [values.viewerUid, values.friendUid]
    .map((id) => id.trim())
    .filter((id) => id.length > 0);

  return ids.filter((id, index) => ids.indexOf(id) === index);
}

export function toSharedExpenseInput(
  values: SharedExpenseFormValues,
): SharedExpenseInput {
  const activeValues = values.splitValues[values.splitMode] ?? {};

  return {
    friendUid: values.friendUid,
    description: values.description,
    amount: values.amount,
    currency: values.currency,
    date: values.date,
    payerId: values.payerId,
    splitMode: values.splitMode,
    participants: getSharedExpenseParticipantIds(values).map((userId) => ({
      userId,
      value: activeValues[userId] ?? "",
    })),
  };
}

export function isPayerSelectable(
  payerId: string,
  participantIds: readonly string[],
): boolean {
  return participantIds.includes(payerId);
}

export function resolvePayerId(
  payerId: string,
  participantIds: readonly string[],
  fallbackId: string,
): string {
  return isPayerSelectable(payerId, participantIds) ? payerId : fallbackId;
}
