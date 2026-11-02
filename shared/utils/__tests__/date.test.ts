import { describe, expect, it } from "@jest/globals";

import {
  formatDateInput,
  getTodayDateInput,
  getTodayIsoDate,
  parseDateInput,
  parseIsoDateToLocalDate,
  toIsoDateValue,
  toIsoTimestamp,
  toLocalIsoDate,
} from "../date";

describe("parseDateInput", () => {
  it("accepts DD/MM/YYYY and DD-MM-YYYY", () => {
    expect(parseDateInput("05/11/2026")).toBe("2026-11-05");
    expect(parseDateInput("05-11-2026")).toBe("2026-11-05");
  });

  it("accepts ISO input and single digit day/month", () => {
    expect(parseDateInput("2026-11-05")).toBe("2026-11-05");
    expect(parseDateInput("5/1/2026")).toBe("2026-01-05");
  });

  it("trims surrounding whitespace", () => {
    expect(parseDateInput("  05/11/2026  ")).toBe("2026-11-05");
  });

  it("rejects invalid calendar dates and malformed values", () => {
    expect(parseDateInput("31/02/2026")).toBeNull();
    expect(parseDateInput("2026-13-01")).toBeNull();
    expect(parseDateInput("not-a-date")).toBeNull();
    expect(parseDateInput("")).toBeNull();
    expect(parseDateInput(null)).toBeNull();
  });
});

describe("formatDateInput", () => {
  it("formats ISO dates as DD/MM/YYYY", () => {
    expect(formatDateInput("2026-11-05")).toBe("05/11/2026");
  });

  it("returns an empty string for invalid input", () => {
    expect(formatDateInput("05/11/2026")).toBe("");
  });
});

describe("local date helpers", () => {
  const reference = new Date(2026, 10, 5, 12, 0, 0);

  it("formats a Date as a local ISO calendar day", () => {
    expect(toLocalIsoDate(reference)).toBe("2026-11-05");
  });

  it("returns null for invalid dates", () => {
    expect(toLocalIsoDate(new Date("invalid"))).toBeNull();
  });

  it("exposes today as local ISO and display values", () => {
    expect(getTodayIsoDate(reference)).toBe("2026-11-05");
    expect(getTodayDateInput(reference)).toBe("05/11/2026");
  });

  it("parses ISO dates at local midnight", () => {
    const date = parseIsoDateToLocalDate("2026-11-05");

    expect(date).not.toBeNull();
    expect(date?.getFullYear()).toBe(2026);
    expect(date?.getMonth()).toBe(10);
    expect(date?.getDate()).toBe(5);
  });

  it("rejects invalid ISO dates", () => {
    expect(parseIsoDateToLocalDate("2026-02-30")).toBeNull();
    expect(parseIsoDateToLocalDate("05/11/2026")).toBeNull();
  });
});

describe("toIsoDateValue", () => {
  it("accepts ISO strings and Date values", () => {
    expect(toIsoDateValue("2026-11-05")).toBe("2026-11-05");
    expect(toIsoDateValue(new Date(2026, 10, 5, 12))).toBe("2026-11-05");
  });

  it("accepts timestamp-like values", () => {
    const timestamp = { toDate: () => new Date(2026, 10, 5, 12) };
    expect(toIsoDateValue(timestamp)).toBe("2026-11-05");
  });

  it("returns null for unsupported values", () => {
    expect(toIsoDateValue(42)).toBeNull();
    expect(toIsoDateValue(null)).toBeNull();
  });
});

describe("toIsoTimestamp", () => {
  it("normalizes strings and Date values", () => {
    expect(toIsoTimestamp("2026-11-05T10:00:00.000Z")).toBe(
      "2026-11-05T10:00:00.000Z",
    );
    expect(toIsoTimestamp(new Date("2026-11-05T10:00:00.000Z"))).toBe(
      "2026-11-05T10:00:00.000Z",
    );
  });

  it("accepts timestamp-like values", () => {
    const timestamp = {
      toDate: () => new Date("2026-11-05T10:00:00.000Z"),
    };
    expect(toIsoTimestamp(timestamp)).toBe("2026-11-05T10:00:00.000Z");
  });

  it("returns null for invalid values", () => {
    expect(toIsoTimestamp("invalid")).toBeNull();
    expect(toIsoTimestamp(new Date("invalid"))).toBeNull();
    expect(toIsoTimestamp(42)).toBeNull();
  });
});
