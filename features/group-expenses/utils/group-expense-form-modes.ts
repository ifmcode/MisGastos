import { parseSplitValue } from "@/features/shared-expenses/utils/expense-split-values";
import {
  canReuseSplitValues,
  getDefaultSplitValues,
} from "@/features/shared-expenses/utils/shared-expense-split-text";

import type { ExpenseSplitMode } from "../types/group-expense.types";
import type { GroupExpenseFormValues } from "./group-expense-form";
import { getGroupExpenseParticipantIds } from "./group-expense-participants";

/** Fixed rows read back as integer cents; an empty row is simply zero. */
function readFixedCents(value: string | undefined): number | null {
  const text = (value ?? "").trim();

  return text.length === 0 ? 0 : parseSplitValue("fixed", text);
}

/**
 * True while the fixed rows are still the defaults derived from the amount: an
 * exact split of it, or empty/zero when there is no amount yet. Anything else is
 * a value the user typed and must survive an amount change.
 */
function isDerivedFixedSplit(values: GroupExpenseFormValues): boolean {
  const participantIds = getGroupExpenseParticipantIds(values);
  if (participantIds.length === 0) return true;

  const defaults = getDefaultSplitValues("fixed", values.amount, participantIds);

  return participantIds.every((userId) => {
    const actual = readFixedCents(values.splitValues.fixed[userId]);
    const expected = parseSplitValue("fixed", defaults[userId] ?? "");

    return actual !== null && actual === expected;
  });
}

/**
 * Writes the amount and only regenerates the fixed rows while they are still the
 * derived defaults. Percentage and shares do not depend on the total.
 */
export function updateGroupExpenseAmount(
  values: GroupExpenseFormValues,
  amount: string,
): GroupExpenseFormValues {
  const next = { ...values, amount };
  if (!isDerivedFixedSplit(values)) return next;

  return {
    ...next,
    splitValues: {
      ...values.splitValues,
      fixed: getDefaultSplitValues(
        "fixed",
        amount,
        getGroupExpenseParticipantIds(values),
      ),
    },
  };
}

/** Keeps user-typed values of the target mode when they still add up. */
export function switchGroupExpenseSplitMode(
  values: GroupExpenseFormValues,
  mode: ExpenseSplitMode,
): GroupExpenseFormValues {
  if (values.splitMode === mode) return values;

  const participantIds = getGroupExpenseParticipantIds(values);
  const kept = canReuseSplitValues(
    mode,
    values.amount,
    participantIds,
    values.splitValues[mode],
    1,
  )
    ? values.splitValues[mode]
    : getDefaultSplitValues(mode, values.amount, participantIds);

  return {
    ...values,
    splitMode: mode,
    splitValues: { ...values.splitValues, [mode]: kept },
  };
}

export function updateGroupSplitValueText(
  values: GroupExpenseFormValues,
  userId: string,
  text: string,
): GroupExpenseFormValues {
  const activeValues = values.splitValues[values.splitMode];

  return {
    ...values,
    splitValues: {
      ...values.splitValues,
      [values.splitMode]: { ...activeValues, [userId]: text },
    },
  };
}
