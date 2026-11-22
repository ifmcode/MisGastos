import { describe, expect, it } from "@jest/globals";

import { getDateFieldSummary } from "../date-field-summary";

const todayIso = "2026-11-21";

describe("getDateFieldSummary", () => {
  it("returns the hint when no date is selected", () => {
    expect(
      getDateFieldSummary({ valueIso: "", todayIso, lastUsedIso: null }),
    ).toBe("hint");
  });

  it("returns the hint for an invalid value", () => {
    expect(
      getDateFieldSummary({
        valueIso: "2026-02-30",
        todayIso,
        lastUsedIso: null,
      }),
    ).toBe("hint");
  });

  it("returns the hint when the value is today", () => {
    expect(
      getDateFieldSummary({ valueIso: todayIso, todayIso, lastUsedIso: null }),
    ).toBe("hint");
  });

  it("returns the hint when the value is yesterday", () => {
    expect(
      getDateFieldSummary({
        valueIso: "2026-11-20",
        todayIso,
        lastUsedIso: null,
      }),
    ).toBe("hint");
  });

  it("computes yesterday across a month boundary", () => {
    expect(
      getDateFieldSummary({
        valueIso: "2025-12-31",
        todayIso: "2026-01-01",
        lastUsedIso: null,
      }),
    ).toBe("hint");
  });

  it("returns the hint when the value is the last used date", () => {
    expect(
      getDateFieldSummary({
        valueIso: "2026-10-30",
        todayIso,
        lastUsedIso: "2026-10-30",
      }),
    ).toBe("hint");
  });

  it("accepts a DD/MM/YYYY last used date", () => {
    expect(
      getDateFieldSummary({
        valueIso: "2026-10-30",
        todayIso,
        lastUsedIso: "30/10/2026",
      }),
    ).toBe("hint");
  });

  it("returns selected for any other valid date", () => {
    expect(
      getDateFieldSummary({
        valueIso: "2026-11-10",
        todayIso,
        lastUsedIso: null,
      }),
    ).toBe("selected");
  });

  it("ignores an invalid today and last used date", () => {
    expect(
      getDateFieldSummary({
        valueIso: "2026-11-10",
        todayIso: "not-a-date",
        lastUsedIso: "also-invalid",
      }),
    ).toBe("selected");
  });
});
