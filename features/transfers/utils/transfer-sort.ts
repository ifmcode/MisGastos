import { Transfer } from "../types/transfer.types";

function toTimestamp(value: string | Date): number {
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

/**
 * Transfers are shown newest first. Dates are ISO calendar strings, so lexical
 * comparison is enough; createdAt is the stable tie-breaker for the same day.
 */
export function sortTransfersByDate(
  transfers: readonly Transfer[],
): Transfer[] {
  return [...transfers].sort((first, second) => {
    const dateComparison = second.date.localeCompare(first.date);

    if (dateComparison !== 0) {
      return dateComparison;
    }

    return (
      toTimestamp(second.createdAt) - toTimestamp(first.createdAt)
    );
  });
}
