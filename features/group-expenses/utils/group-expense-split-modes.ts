import type { ExpenseSplitMode } from "../types/group-expense.types";

/** Canonical mode order used by the chips and the legacy fallback. */
const SPLIT_MODE_ORDER: readonly ExpenseSplitMode[] = [
  "equal",
  "percentage",
  "fixed",
  "shares",
];

/**
 * Modes offered by the group-expense form. `percentage` and `shares` stay valid
 * in the domain and in stored documents, but a normal create only offers the
 * two modes the 1:1 form exposes.
 */
export const VISIBLE_GROUP_SPLIT_MODES: readonly ExpenseSplitMode[] = [
  "equal",
  "fixed",
];

/**
 * Visible modes plus the current one when it is a legacy `percentage`/`shares`
 * expense. The stored mode is never hidden, so an old record can be saved
 * unchanged or switched to an offered mode instead of being trapped.
 */
export function getVisibleGroupSplitModes(
  current: ExpenseSplitMode,
): readonly ExpenseSplitMode[] {
  if (VISIBLE_GROUP_SPLIT_MODES.includes(current)) {
    return VISIBLE_GROUP_SPLIT_MODES;
  }

  return SPLIT_MODE_ORDER.filter(
    (mode) => VISIBLE_GROUP_SPLIT_MODES.includes(mode) || mode === current,
  );
}
