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

function dateToLocalIsoDate(date: Date): string | null {
  if (Number.isNaN(date.getTime())) return null;
  return buildIsoDate(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
  );
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
  if (value instanceof Date) return dateToLocalIsoDate(value);
  if (isTimestampLike(value)) return dateToLocalIsoDate(value.toDate());
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
  const isoDate = dateToLocalIsoDate(date);
  return isoDate ? formatDateInput(isoDate) : "";
}

export function getTodayIsoDate(date = new Date()): string {
  return dateToLocalIsoDate(date) ?? "";
}
