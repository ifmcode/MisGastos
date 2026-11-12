import { parseIsoDateToLocalDate, toLocalIsoDate } from "./date";

export interface CalendarDay {
  day: number;
  isoDate: string;
}

export interface CalendarMonth {
  year: number;
  month: number;
  label: string;
  weekdayLabels: string[];
  weeks: Array<Array<CalendarDay | null>>;
}

export interface CalendarMonthRef {
  year: number;
  month: number;
}

const DEFAULT_CALENDAR_LOCALE = "es-ES";

function capitalize(value: string): string {
  return value.length > 0 ? `${value.charAt(0).toUpperCase()}${value.slice(1)}` : value;
}

export function formatMonthLabel(
  year: number,
  month: number,
  locale = DEFAULT_CALENDAR_LOCALE,
): string {
  const date = new Date(year, month, 1);

  try {
    const monthName = new Intl.DateTimeFormat(locale, {
      month: "long",
    }).format(date);
    const yearText = new Intl.DateTimeFormat(locale, {
      year: "numeric",
    }).format(date);

    return capitalize(`${monthName} ${yearText}`);
  } catch {
    return String(year);
  }
}

/** Narrow weekday labels starting on Monday, in the requested locale. */
export function getWeekdayLabels(locale = DEFAULT_CALENDAR_LOCALE): string[] {
  const monday = new Date(2024, 0, 1);

  try {
    const formatter = new Intl.DateTimeFormat(locale, { weekday: "narrow" });
    return Array.from({ length: 7 }, (_, index) =>
      formatter.format(new Date(2024, 0, 1 + index)),
    );
  } catch {
    return ["L", "M", "X", "J", "V", "S", "D"];
  }
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
  locale = DEFAULT_CALENDAR_LOCALE,
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

  return {
    year,
    month,
    label: formatMonthLabel(year, month, locale),
    weekdayLabels: getWeekdayLabels(locale),
    weeks,
  };
}
