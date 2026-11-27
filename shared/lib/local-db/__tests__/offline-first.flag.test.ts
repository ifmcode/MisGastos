import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { Platform } from "react-native";

import { isOfflineFirstEnabled } from "../offline-first.flag";

jest.mock("react-native", () => ({ Platform: { OS: "ios" } }));

const FLAG = "EXPO_PUBLIC_OFFLINE_FIRST";

describe("isOfflineFirstEnabled", () => {
  let previous: string | undefined;

  beforeEach(() => {
    previous = process.env[FLAG];
    delete process.env[FLAG];
  });

  afterEach(() => {
    jest.restoreAllMocks();

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

  it("turns on for android", () => {
    process.env[FLAG] = "true";
    jest.replaceProperty(Platform, "OS", "android");

    expect(isOfflineFirstEnabled()).toBe(true);
  });

  it("stays off on web even with the flag on", () => {
    process.env[FLAG] = "true";
    jest.replaceProperty(Platform, "OS", "web");

    expect(isOfflineFirstEnabled()).toBe(false);
  });
});
