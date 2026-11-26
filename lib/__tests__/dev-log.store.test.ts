import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

import {
  dismissDevLog,
  formatDevLogArgs,
  getDevLogSnapshot,
  isIgnoredDevLog,
  pushDevLog,
  resetDevLogs,
  subscribeDevLogs,
} from "../dev-log.store";

beforeEach(() => {
  resetDevLogs();
  jest.useFakeTimers();
});

afterEach(() => {
  resetDevLogs();
  jest.useRealTimers();
});

describe("formatDevLogArgs", () => {
  it("joins strings, numbers and objects", () => {
    expect(
      formatDevLogArgs(["message", 42, { code: "X" }]),
    ).toBe('message 42 {"code":"X"}');
  });

  it("formats an Error with its name", () => {
    expect(formatDevLogArgs([new Error("boom")])).toBe("Error: boom");
  });

  it("degrades a circular object instead of throwing", () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;

    expect(formatDevLogArgs([circular])).toBe("[object Object]");
  });

  it("trims and caps the message", () => {
    expect(formatDevLogArgs(["  warning  "])).toBe("warning");
    expect(formatDevLogArgs(["x".repeat(2000)])).toHaveLength(600);
  });
});

describe("isIgnoredDevLog", () => {
  it("filters the known Firestore and deprecation noise", () => {
    expect(isIgnoredDevLog("Could not reach Cloud Firestore backend.")).toBe(true);
    expect(isIgnoredDevLog("SafeAreaView has been deprecated")).toBe(true);
  });

  it("keeps anything else", () => {
    expect(isIgnoredDevLog("A real warning")).toBe(false);
  });
});

describe("dev log store", () => {
  it("pushes a warning and notifies subscribers", () => {
    const listener = jest.fn();
    subscribeDevLogs(listener);

    pushDevLog("warn", "algo pasa");

    expect(getDevLogSnapshot()).toEqual([
      { id: 1, level: "warn", message: "algo pasa" },
    ]);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("deduplicates and ignores known noise", () => {
    pushDevLog("warn", "algo pasa");
    pushDevLog("warn", "algo pasa");
    pushDevLog("warn", "Could not reach Cloud Firestore backend.");

    expect(getDevLogSnapshot()).toHaveLength(1);
  });

  it("keeps at most the three newest cards", () => {
    for (let index = 1; index <= 4; index += 1) {
      pushDevLog("error", `error ${index}`);
    }

    expect(getDevLogSnapshot().map((entry) => entry.message)).toEqual([
      "error 2",
      "error 3",
      "error 4",
    ]);
  });

  it("dismisses a card manually", () => {
    pushDevLog("warn", "algo pasa");

    dismissDevLog(1);

    expect(getDevLogSnapshot()).toEqual([]);
  });

  it("auto-dismisses after the window", () => {
    pushDevLog("warn", "algo pasa");

    jest.advanceTimersByTime(8_000);

    expect(getDevLogSnapshot()).toEqual([]);
  });
});
