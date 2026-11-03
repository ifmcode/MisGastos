import { beforeEach, describe, expect, it } from "@jest/globals";

import { getDefaultMovementIsoDate } from "../date-defaults";
import {
  rememberLastUsedDate,
  resetLastUsedDate,
} from "../last-used-date-store";

describe("getDefaultMovementIsoDate", () => {
  const reference = new Date(2026, 10, 3, 12);

  beforeEach(() => {
    resetLastUsedDate();
  });

  it("returns today when there is no session date", () => {
    expect(getDefaultMovementIsoDate(reference)).toBe("2026-11-03");
  });

  it("returns the last used date when it is visible", () => {
    rememberLastUsedDate("2026-10-30");

    expect(getDefaultMovementIsoDate(reference)).toBe("2026-10-30");
  });

  it("falls back to today when the last used date is today or yesterday", () => {
    rememberLastUsedDate("2026-11-03");
    expect(getDefaultMovementIsoDate(reference)).toBe("2026-11-03");

    rememberLastUsedDate("2026-11-02");
    expect(getDefaultMovementIsoDate(reference)).toBe("2026-11-03");
  });
});
