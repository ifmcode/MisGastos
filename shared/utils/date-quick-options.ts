import { toLocalIsoDate } from "./date";

export interface DateQuickOption {
  key: "today" | "yesterday";
  label: string;
  isoDate: string;
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
  key: DateQuickOption["key"],
  label: string,
  isoDate: string,
): DateQuickOption {
  return { key, label, isoDate, displayDate: formatShortDate(isoDate) };
}

/** Today and yesterday in local calendar days, formatted as DD/MM. */
export function getDateQuickOptions(reference = new Date()): DateQuickOptions {
  const todayIso = toLocalIsoDate(reference) ?? "";
  const yesterday = new Date(
    reference.getFullYear(),
    reference.getMonth(),
    reference.getDate() - 1,
  );
  const yesterdayIso = toLocalIsoDate(yesterday) ?? "";

  return {
    today: buildOption("today", "Hoy", todayIso),
    yesterday: buildOption("yesterday", "Ayer", yesterdayIso),
  };
}
