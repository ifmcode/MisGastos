import { describe, expect, it } from "@jest/globals";

import {
  computeNextAttemptAt,
  computeRetryDelayMs,
  SYNC_RETRY_BASE_MS,
  SYNC_RETRY_JITTER_RATIO,
  SYNC_RETRY_MAX_MS,
} from "../backoff";

const noJitter = () => 0.5;

describe("computeRetryDelayMs", () => {
  it("waits about one second after the first failure", () => {
    expect(computeRetryDelayMs(1, noJitter)).toBe(SYNC_RETRY_BASE_MS);
  });

  it("doubles every attempt", () => {
    expect(computeRetryDelayMs(2, noJitter)).toBe(2_000);
    expect(computeRetryDelayMs(3, noJitter)).toBe(4_000);
    expect(computeRetryDelayMs(4, noJitter)).toBe(8_000);
  });

  it("caps the delay at five minutes", () => {
    expect(computeRetryDelayMs(20, noJitter)).toBe(SYNC_RETRY_MAX_MS);
  });

  it("applies ±20 % jitter", () => {
    expect(computeRetryDelayMs(1, () => 0)).toBe(
      SYNC_RETRY_BASE_MS - SYNC_RETRY_BASE_MS * SYNC_RETRY_JITTER_RATIO,
    );
    expect(computeRetryDelayMs(1, () => 1)).toBe(
      SYNC_RETRY_BASE_MS + SYNC_RETRY_BASE_MS * SYNC_RETRY_JITTER_RATIO,
    );
  });

  it("treats zero or negative attempts as the first retry", () => {
    expect(computeRetryDelayMs(0, noJitter)).toBe(SYNC_RETRY_BASE_MS);
    expect(computeRetryDelayMs(-3, noJitter)).toBe(SYNC_RETRY_BASE_MS);
  });
});

describe("computeNextAttemptAt", () => {
  it("adds the delay to the reference instant as ISO", () => {
    const now = new Date("2026-11-26T10:00:00.000Z");

    expect(computeNextAttemptAt(1, now, noJitter)).toBe(
      "2026-11-26T10:00:01.000Z",
    );
  });
});
