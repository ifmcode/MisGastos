import type { CurrencyCode } from "@/shared/constants/currencies";
import {
  emptySplitValues,
  type SplitValueTexts,
} from "@/features/shared-expenses/utils/shared-expense-form";
import {
  formatBpsText,
  formatCentsText,
} from "@/features/shared-expenses/utils/shared-expense-split-text";
import { formatDateInput } from "@/shared/utils/date";

import type {
  ExpenseSplitMode,
  GroupExpense,
} from "../types/group-expense.types";
import {
  createGroupExpenseFormValues,
  type GroupExpenseFormValues,
} from "./group-expense-form";
import { resolveGroupExpensePayer } from "./group-expense-participants";

export interface GroupExpenseInitialValuesOptions {
  editingExpense: GroupExpense | null;
  viewerUid: string;
  /** Group chosen in the picker; ignored when editing (the expense owns it). */
  groupId: string;
  memberIds: readonly string[];
  /** Group default currency of a new expense. */
  groupCurrency: CurrencyCode;
  /** ISO date of a new expense. */
  today: string;
}

/**
 * Stored shares seed every split mode, so editing an expense and switching mode
 * keeps meaningful values instead of starting from zero. `equal` needs no rows.
 */
function buildSplitValues(
  expense: GroupExpense,
): Record<ExpenseSplitMode, SplitValueTexts> {
  const values = emptySplitValues();

  for (const participant of expense.participants) {
    values.fixed[participant.userId] = formatCentsText(participant.shareCents);
    if (participant.percentageBps !== undefined) {
      values.percentage[participant.userId] = formatBpsText(
        participant.percentageBps,
      );
    }
    if (participant.weight !== undefined) {
      values.shares[participant.userId] = String(participant.weight);
    }
  }

  return values;
}

/** Values of the create/edit page sheet, rebuilt whenever the group changes. */
export function getGroupExpenseInitialValues({
  editingExpense,
  viewerUid,
  groupId,
  memberIds,
  groupCurrency,
  today,
}: GroupExpenseInitialValuesOptions): GroupExpenseFormValues {
  if (!editingExpense) {
    return createGroupExpenseFormValues({
      viewerUid,
      groupId,
      memberIds,
      currency: groupCurrency,
      date: today,
    });
  }

  const base = createGroupExpenseFormValues({
    viewerUid,
    groupId: editingExpense.groupId,
    memberIds,
    currency: editingExpense.currency,
    date: editingExpense.date,
  });

  return {
    ...base,
    description: editingExpense.description,
    amount: formatCentsText(editingExpense.amountCents),
    dateText: formatDateInput(editingExpense.date),
    payerId: resolveGroupExpensePayer(
      editingExpense.payerId,
      base.memberIds,
      viewerUid,
    ),
    participantIds: editingExpense.participants
      .map((participant) => participant.userId)
      .filter((userId) => base.memberIds.includes(userId)),
    splitMode: editingExpense.splitMode,
    splitValues: buildSplitValues(editingExpense),
  };
}
