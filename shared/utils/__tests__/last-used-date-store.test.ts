import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import {
  getLastUsedIsoDate,
  rememberLastUsedDate,
  resetLastUsedDate,
  subscribeToLastUsedDate,
} from "../last-used-date-store";

describe("last-used-date-store", () => {
  beforeEach(() => {
    resetLastUsedDate();
  });

  it("starts empty", () => {
    expect(getLastUsedIsoDate()).toBeNull();
  });

  it("remembers and normalizes the saved date", () => {
    const listener = jest.fn();
    const unsubscribe = subscribeToLastUsedDate(listener);

    rememberLastUsedDate("30/10/2026");

    expect(getLastUsedIsoDate()).toBe("2026-10-30");
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
  });

  it("ignores invalid dates and duplicates", () => {
    const listener = jest.fn();
    subscribeToLastUsedDate(listener);

    rememberLastUsedDate("not-a-date");
    expect(getLastUsedIsoDate()).toBeNull();

    rememberLastUsedDate("2026-10-30");
    rememberLastUsedDate("30/10/2026");

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("stops notifying after unsubscribe", () => {
    const listener = jest.fn();
    const unsubscribe = subscribeToLastUsedDate(listener);

    unsubscribe();
    rememberLastUsedDate("2026-10-30");

    expect(listener).not.toHaveBeenCalled();
  });
});
