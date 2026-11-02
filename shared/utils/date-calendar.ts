import { parseIsoDateToLocalDate, toLocalIsoDate } from "./date";

export interface CalendarDay {
  day: number;
  isoDate: string;
}

export interface CalendarMonth {
  year: number;
  month: number;
  label: string;
  weeks: Array<Array<CalendarDay | null>>;
}

export interface CalendarMonthRef {
  year: number;
  month: number;
}

export const WEEKDAY_LABELS = ["L", "M", "X", "J", "V", "S", "D"] as const;

const MONTH_NAMES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
] as const;

export function formatMonthLabel(year: number, month: number): string {
  const name = MONTH_NAMES[month] ?? "";
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${year}`;
}

export function shiftCalendarMonth(
  year: number,
  month: number,
  delta: number,
): CalendarMonthRef {
  const shifted = new Date(year, month + delta, 1);
  return { year: shifted.getFullYear(), month: shifted.getMonth() };
}

export function calendarMonthFromIso(
  valueIso: string,
  fallback = new Date(),
): CalendarMonthRef {
  const date = parseIsoDateToLocalDate(valueIso) ?? fallback;
  return { year: date.getFullYear(), month: date.getMonth() };
}

/** Weeks start on Monday; leading and trailing blanks are `null`. */
export function buildCalendarMonth(
  year: number,
  month: number,
): CalendarMonth {
  const firstWeekday = new Date(year, month, 1).getDay();
  const leadingBlanks = (firstWeekday + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Array<CalendarDay | null> = Array.from(
    { length: leadingBlanks },
    () => null,
  );

  for (let day = 1; day <= daysInMonth; day += 1) {
    const isoDate = toLocalIsoDate(new Date(year, month, day));
    if (isoDate) cells.push({ day, isoDate });
  }

  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: Array<Array<CalendarDay | null>> = [];
  for (let index = 0; index < cells.length; index += 7) {
    weeks.push(cells.slice(index, index + 7));
  }

  return { year, month, label: formatMonthLabel(year, month), weeks };
}
