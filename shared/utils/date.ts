const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const INPUT_DATE_PATTERN = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/;

interface TimestampLike {
  toDate(): Date;
}

function isTimestampLike(value: unknown): value is TimestampLike {
  if (typeof value !== "object" || value === null) return false;

  const candidate = value as { toDate?: unknown };
  return typeof candidate.toDate === "function";
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function buildIsoDate(
  year: number,
  month: number,
  day: number,
): string | null {
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return `${year}-${pad(month)}-${pad(day)}`;
}

export function toLocalIsoDate(date: Date): string | null {
  if (Number.isNaN(date.getTime())) return null;
  return buildIsoDate(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
  );
}

/**
 * Converts a YYYY-MM-DD value into a Date at local midnight, so pickers and
 * comparisons always operate on the user's calendar day.
 */
export function parseIsoDateToLocalDate(value: string): Date | null {
  const match = ISO_DATE_PATTERN.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

/**
 * Accepts DD/MM/YYYY, DD-MM-YYYY or YYYY-MM-DD and returns YYYY-MM-DD.
 * Invalid calendar dates and malformed values return null.
 */
export function parseDateInput(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;

  const normalized = value.trim();
  if (normalized.length === 0) return null;

  const isoMatch = ISO_DATE_PATTERN.exec(normalized);
  if (isoMatch) {
    return buildIsoDate(
      Number(isoMatch[1]),
      Number(isoMatch[2]),
      Number(isoMatch[3]),
    );
  }

  const inputMatch = INPUT_DATE_PATTERN.exec(normalized);
  if (inputMatch) {
    return buildIsoDate(
      Number(inputMatch[3]),
      Number(inputMatch[2]),
      Number(inputMatch[1]),
    );
  }

  return null;
}

export function toIsoDateValue(value: unknown): string | null {
  if (typeof value === "string") return parseDateInput(value);
  if (value instanceof Date) return toLocalIsoDate(value);
  if (isTimestampLike(value)) return toLocalIsoDate(value.toDate());
  return null;
}

export function toIsoTimestamp(value: unknown): string | null {
  if (typeof value === "string") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  }

  if (isTimestampLike(value)) {
    const date = value.toDate();
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }

  return null;
}

export function formatDateInput(isoDate: string): string {
  const match = ISO_DATE_PATTERN.exec(isoDate);
  if (!match) return "";

  return `${match[3]}/${match[2]}/${match[1]}`;
}

export function getTodayDateInput(date = new Date()): string {
  const isoDate = toLocalIsoDate(date);
  return isoDate ? formatDateInput(isoDate) : "";
}

export function getTodayIsoDate(date = new Date()): string {
  return toLocalIsoDate(date) ?? "";
}
