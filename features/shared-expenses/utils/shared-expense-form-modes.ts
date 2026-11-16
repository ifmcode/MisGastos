import {
  EXPENSE_SPLIT_MODES,
  type ExpenseSplitMode,
} from "../types/shared-expense.types";
import { parseSplitValue } from "./expense-split-values";
import {
  getSharedExpenseParticipantIds,
  type SharedExpenseFormValues,
} from "./shared-expense-form";
import {
  canReuseSplitValues,
  getDefaultSplitValues,
} from "./shared-expense-split-text";

/** Regenerates only the modes whose remembered values no longer fit. */
export function refreshSplitValueDefaults(
  values: SharedExpenseFormValues,
): SharedExpenseFormValues {
  const participantIds = getSharedExpenseParticipantIds(values);
  const splitValues = { ...values.splitValues };

  for (const mode of EXPENSE_SPLIT_MODES) {
    if (
      canReuseSplitValues(mode, values.amount, participantIds, splitValues[mode])
    ) {
      continue;
    }

    splitValues[mode] = getDefaultSplitValues(
      mode,
      values.amount,
      participantIds,
    );
  }

  return { ...values, splitValues };
}

/**
 * Fixed rows read back as integer cents. An empty row counts as zero, which is
 * how the form renders an untouched split before the amount exists.
 */
function readFixedCents(value: string | undefined): number | null {
  const text = (value ?? "").trim();

  return text.length === 0 ? 0 : parseSplitValue("fixed", text);
}

/**
 * True while the fixed rows are still the defaults derived from the current
 * amount: an exact split of it, or empty/zero when there is no amount yet.
 * Anything else is a value the user typed and must survive an amount change.
 */
function isDerivedFixedSplit(values: SharedExpenseFormValues): boolean {
  const participantIds = getSharedExpenseParticipantIds(values);
  if (participantIds.length === 0) return true;

  const defaults = getDefaultSplitValues("fixed", values.amount, participantIds);

  return participantIds.every((userId) => {
    const actual = readFixedCents(values.splitValues.fixed[userId]);
    const expected = parseSplitValue("fixed", defaults[userId] ?? "");

    return actual !== null && actual === expected;
  });
}

/**
 * Writes the amount and only regenerates the fixed rows while they are still
 * the derived defaults, so a typed split is never overwritten. Percentage and
 * shares do not depend on the total and are left untouched.
 */
export function updateAmountAndFixedSplit(
  values: SharedExpenseFormValues,
  amount: string,
): SharedExpenseFormValues {
  const next = { ...values, amount };
  if (!isDerivedFixedSplit(values)) return next;

  return {
    ...next,
    splitValues: {
      ...values.splitValues,
      fixed: getDefaultSplitValues(
        "fixed",
        amount,
        getSharedExpenseParticipantIds(values),
      ),
    },
  };
}

/** Keeps user-typed values of the target mode when they still add up. */
export function switchExpenseSplitMode(
  values: SharedExpenseFormValues,
  mode: ExpenseSplitMode,
): SharedExpenseFormValues {
  if (values.splitMode === mode) return values;

  const participantIds = getSharedExpenseParticipantIds(values);
  const kept = canReuseSplitValues(
    mode,
    values.amount,
    participantIds,
    values.splitValues[mode],
  )
    ? values.splitValues[mode]
    : getDefaultSplitValues(mode, values.amount, participantIds);

  return {
    ...values,
    splitMode: mode,
    splitValues: { ...values.splitValues, [mode]: kept },
  };
}

export function updateSplitValueText(
  values: SharedExpenseFormValues,
  userId: string,
  text: string,
): SharedExpenseFormValues {
  const activeValues = values.splitValues[values.splitMode];

  return {
    ...values,
    splitValues: {
      ...values.splitValues,
      [values.splitMode]: { ...activeValues, [userId]: text },
    },
  };
}
