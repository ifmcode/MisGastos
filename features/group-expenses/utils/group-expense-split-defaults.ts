import { EXPENSE_SPLIT_MODES } from "@/features/shared-expenses/types/shared-expense.types";
import {
  canReuseSplitValues,
  getDefaultSplitValues,
} from "@/features/shared-expenses/utils/shared-expense-split-text";

import type { ExpenseSplitMode } from "../types/group-expense.types";
import type { GroupExpenseFormValues } from "./group-expense-form";
import { getGroupExpenseParticipantIds } from "./group-expense-participants";

/**
 * Adds a default row for every participant that has no remembered value yet, so
 * a member added to the selection never reaches the split as an empty input.
 */
function fillMissingRows(
  mode: ExpenseSplitMode,
  amountText: string,
  participantIds: readonly string[],
  values: Record<string, string>,
): Record<string, string> {
  if (mode === "equal") return values;

  const defaults = getDefaultSplitValues(mode, amountText, participantIds);
  const next = { ...values };

  for (const userId of participantIds) {
    if (next[userId] === undefined) next[userId] = defaults[userId] ?? "";
  }

  return next;
}

/**
 * Regenerates only the modes whose remembered values no longer fit the selected
 * participants and the current amount. `minParticipants` is 1 because a group
 * expense may charge a single participant when the payer pays for others.
 */
export function refreshGroupSplitValueDefaults(
  values: GroupExpenseFormValues,
): GroupExpenseFormValues {
  const participantIds = getGroupExpenseParticipantIds(values);
  const splitValues = { ...values.splitValues };

  for (const mode of EXPENSE_SPLIT_MODES) {
    const current = fillMissingRows(
      mode,
      values.amount,
      participantIds,
      splitValues[mode],
    );

    splitValues[mode] = canReuseSplitValues(
      mode,
      values.amount,
      participantIds,
      current,
      1,
    )
      ? current
      : getDefaultSplitValues(mode, values.amount, participantIds);
  }

  return { ...values, splitValues };
}
