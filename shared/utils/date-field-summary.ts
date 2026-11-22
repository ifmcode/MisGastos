import { parseDateInput, parseIsoDateToLocalDate, toLocalIsoDate } from "./date";

export type DateFieldSummary = "hint" | "selected";

export interface DateFieldSummaryInput {
  /** Selected ISO date; empty means no date in the filters. */
  valueIso: string;
  todayIso: string;
  lastUsedIso?: string | null;
}

/**
 * Today, yesterday and the last used date are already covered by a quick chip,
 * so they keep the default hint. Any other valid date is called out explicitly.
 */
export function getDateFieldSummary({
  valueIso,
  todayIso,
  lastUsedIso,
}: DateFieldSummaryInput): DateFieldSummary {
  const value = parseDateInput(valueIso);
  if (!value) return "hint";

  const today = parseDateInput(todayIso);
  if (value === today) return "hint";

  const todayDate = today ? parseIsoDateToLocalDate(today) : null;
  const yesterday = todayDate
    ? toLocalIsoDate(
        new Date(
          todayDate.getFullYear(),
          todayDate.getMonth(),
          todayDate.getDate() - 1,
        ),
      )
    : null;
  if (value === yesterday) return "hint";

  const lastUsed = parseDateInput(lastUsedIso);
  if (value === lastUsed) return "hint";

  return "selected";
}
