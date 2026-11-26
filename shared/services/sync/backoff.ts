/** First retry waits about one second, then the delay doubles. */
export const SYNC_RETRY_BASE_MS = 1_000;

/** The delay never exceeds five minutes, matching ADR §5.3. */
export const SYNC_RETRY_MAX_MS = 300_000;

/** ±20 % jitter so several devices do not retry in lockstep. */
export const SYNC_RETRY_JITTER_RATIO = 0.2;

/**
 * Delay before the next attempt. `attempts` is the new attempt count (1 after
 * the first failure), so the first retry is ~1 s and the cap is 5 min.
 */
export function computeRetryDelayMs(
  attempts: number,
  random: () => number = Math.random,
): number {
  const exponent = Math.max(Math.trunc(attempts) - 1, 0);
  const base = Math.min(SYNC_RETRY_BASE_MS * 2 ** exponent, SYNC_RETRY_MAX_MS);
  const jitter = base * SYNC_RETRY_JITTER_RATIO;
  const offset = (random() * 2 - 1) * jitter;

  return Math.max(0, Math.round(base + offset));
}

/** ISO instant of the next attempt, or null when it should wait for the user. */
export function computeNextAttemptAt(
  attempts: number,
  now: Date,
  random: () => number = Math.random,
): string {
  return new Date(
    now.getTime() + computeRetryDelayMs(attempts, random),
  ).toISOString();
}
