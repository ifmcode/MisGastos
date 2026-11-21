import type { CurrencyCode } from "@/shared/constants/currencies";
import {
  emptySplitValues,
  type SplitValueTexts,
} from "@/features/shared-expenses/utils/shared-expense-form";
import { formatDateInput } from "@/shared/utils/date";

import type {
  ExpenseSplitMode,
  GroupExpenseInput,
} from "../types/group-expense.types";
import {
  getGroupExpenseParticipantIds,
  readGroupExpenseIds,
  resolveGroupExpensePayer,
} from "./group-expense-participants";

/** Raw form state of a group expense; every amount stays as typed text. */
export interface GroupExpenseFormValues {
  viewerUid: string;
  groupId: string;
  /** Active members of the selected group; the payer and split are scoped to it. */
  memberIds: string[];
  description: string;
  amount: string;
  currency: CurrencyCode;
  /** ISO date (`YYYY-MM-DD`); empty while the user types an invalid date. */
  date: string;
  /** Same date as typed (`DD/MM/YYYY`). */
  dateText: string;
  payerId: string;
  /** Selected participants only: the payer may be excluded and pay for others. */
  participantIds: string[];
  splitMode: ExpenseSplitMode;
  splitValues: Record<ExpenseSplitMode, SplitValueTexts>;
}

export interface GroupExpenseFormDefaults {
  viewerUid: string;
  groupId: string;
  memberIds: readonly string[];
  currency: CurrencyCode;
  date: string;
  payerId?: string;
}

export function createGroupExpenseFormValues(
  defaults: GroupExpenseFormDefaults,
): GroupExpenseFormValues {
  const memberIds = readGroupExpenseIds(defaults.memberIds);

  return {
    viewerUid: defaults.viewerUid,
    groupId: defaults.groupId,
    memberIds,
    description: "",
    amount: "",
    currency: defaults.currency,
    date: defaults.date,
    dateText: formatDateInput(defaults.date),
    payerId: resolveGroupExpensePayer(
      defaults.payerId ?? "",
      memberIds,
      defaults.viewerUid,
    ),
    participantIds: [...memberIds],
    splitMode: "equal",
    splitValues: emptySplitValues(),
  };
}

/** Raw payload for the schema: only the selected participants carry a value. */
export function toGroupExpenseInput(
  values: GroupExpenseFormValues,
): GroupExpenseInput {
  const activeValues = values.splitValues[values.splitMode] ?? {};

  return {
    groupId: values.groupId,
    description: values.description,
    amount: values.amount,
    currency: values.currency,
    date: values.date,
    payerId: values.payerId,
    splitMode: values.splitMode,
    participants: getGroupExpenseParticipantIds(values).map((userId) => ({
      userId,
      value: activeValues[userId] ?? "",
    })),
  };
}
