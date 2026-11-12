import { parseDateInput, toLocalIsoDate } from "./date";

export type DateQuickOptionKey = "last" | "today" | "yesterday";

export type DateQuickOptionLabelKey =
  | "date.last"
  | "date.today"
  | "date.yesterday";

export interface DateQuickOption {
  key: DateQuickOptionKey;
  labelKey: DateQuickOptionLabelKey;
  isoDate: string;
  /** Kept for tests and non-UI callers; UI formats with `Intl`. */
  displayDate: string;
}

export interface DateQuickOptions {
  today: DateQuickOption;
  yesterday: DateQuickOption;
}

function formatShortDate(isoDate: string): string {
  const parts = isoDate.split("-");
  if (parts.length !== 3) return "";

  return `${parts[2]}/${parts[1]}`;
}

function buildOption(
  key: DateQuickOptionKey,
  labelKey: DateQuickOptionLabelKey,
  isoDate: string,
): DateQuickOption {
  return { key, labelKey, isoDate, displayDate: formatShortDate(isoDate) };
}

/** Today and yesterday in local calendar days. */
export function getDateQuickOptions(reference = new Date()): DateQuickOptions {
  const todayIso = toLocalIsoDate(reference) ?? "";
  const yesterday = new Date(
    reference.getFullYear(),
    reference.getMonth(),
    reference.getDate() - 1,
  );
  const yesterdayIso = toLocalIsoDate(yesterday) ?? "";

  return {
    today: buildOption("today", "date.today", todayIso),
    yesterday: buildOption("yesterday", "date.yesterday", yesterdayIso),
  };
}

/**
 * Last used date. Returns null when the value is invalid or already covered by
 * the Hoy/Ayer quick options, so the row never duplicates.
 */
export function getLastUsedDateOption(
  isoDate: string | null | undefined,
  reference = new Date(),
): DateQuickOption | null {
  const normalized = parseDateInput(isoDate);
  if (!normalized) return null;

  const { today, yesterday } = getDateQuickOptions(reference);
  if (normalized === today.isoDate || normalized === yesterday.isoDate) {
    return null;
  }

  return buildOption("last", "date.last", normalized);
}
