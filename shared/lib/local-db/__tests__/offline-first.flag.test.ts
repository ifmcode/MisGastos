import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import { isOfflineFirstEnabled } from "../offline-first.flag";

const FLAG = "EXPO_PUBLIC_OFFLINE_FIRST";

describe("isOfflineFirstEnabled", () => {
  let previous: string | undefined;

  beforeEach(() => {
    previous = process.env[FLAG];
    delete process.env[FLAG];
  });

  afterEach(() => {
    if (previous === undefined) {
      delete process.env[FLAG];
    } else {
      process.env[FLAG] = previous;
    }
  });

  it("is off by default", () => {
    expect(isOfflineFirstEnabled()).toBe(false);
  });

  it("turns on only with the exact true string", () => {
    process.env[FLAG] = "true";
    expect(isOfflineFirstEnabled()).toBe(true);

    process.env[FLAG] = "TRUE";
    expect(isOfflineFirstEnabled()).toBe(false);

    process.env[FLAG] = "1";
    expect(isOfflineFirstEnabled()).toBe(false);
  });
});
