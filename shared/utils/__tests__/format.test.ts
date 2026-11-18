import { describe, expect, it } from "@jest/globals";

import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatNumber,
  formatPercent,
  formatRelativeTime,
} from "../format";

describe("formatCurrency", () => {
  it("follows the Spanish and English locale conventions", () => {
    const spanish = formatCurrency(1234.5, "EUR", "es-ES");
    const english = formatCurrency(1234.5, "EUR", "en-US");

    expect(spanish).toContain(",50");
    expect(spanish).toContain("€");
    expect(english).toContain("1,234.50");
    expect(english).toContain("€");
  });

  it("falls back safely for invalid numbers", () => {
    expect(formatCurrency(Number.NaN, "EUR", "es-ES")).toContain("0,00");
  });
});

describe("formatNumber and formatPercent", () => {
  it("uses the active locale", () => {
    expect(formatNumber(1234.5, "en-US")).toBe("1,234.5");
    expect(formatNumber(1234.5, "es-ES")).toContain(",5");
    expect(formatPercent(0.25, "en-US")).toBe("25%");
  });
});

describe("formatDate", () => {
  it("uses day/month order for Spanish and month/day for English", () => {
    expect(formatDate("2026-11-05", "es-ES")).toBe("05/11/2026");
    expect(formatDate("2026-11-05", "en-US")).toBe("11/05/2026");
  });

  it("returns the input when the date is invalid", () => {
    expect(formatDate("not-a-date", "es-ES")).toBe("not-a-date");
  });
});

describe("formatDateTime", () => {
  it("formats a Date with the active locale", () => {
    const value = new Date(2026, 10, 5, 14, 30);
    const formatted = formatDateTime(value, "es-ES");

    expect(formatted).toContain("2026");
    expect(formatted.length).toBeGreaterThan(0);
  });

  it("returns the input for invalid values", () => {
    expect(formatDateTime("not-a-date", "es-ES")).toBe("not-a-date");
  });
});

describe("formatRelativeTime", () => {
  const now = new Date("2026-11-18T12:00:00.000Z");

  function ago(ms: number): Date {
    return new Date(now.getTime() - ms);
  }

  it("uses the seconds bucket and the automatic wording of the locale", () => {
    expect(formatRelativeTime(ago(10 * 1000), "es-ES", now)).toBe(
      "hace 10 segundos",
    );
    expect(formatRelativeTime(ago(10 * 1000), "en-US", now)).toBe(
      "10 seconds ago",
    );
    expect(formatRelativeTime(now, "es-ES", now)).toBe("ahora");
    expect(formatRelativeTime(now, "en-US", now)).toBe("now");
  });

  it("switches to minutes and hours", () => {
    expect(formatRelativeTime(ago(5 * 60 * 1000), "es-ES", now)).toBe(
      "hace 5 minutos",
    );
    expect(formatRelativeTime(ago(5 * 60 * 1000), "en-US", now)).toBe(
      "5 minutes ago",
    );
    expect(formatRelativeTime(ago(2 * 60 * 60 * 1000), "es-ES", now)).toBe(
      "hace 2 horas",
    );
    expect(formatRelativeTime(ago(2 * 60 * 60 * 1000), "en-US", now)).toBe(
      "2 hours ago",
    );
  });

  it("switches to days for older values", () => {
    const threeDaysAgo = ago(3 * 24 * 60 * 60 * 1000);

    expect(formatRelativeTime(threeDaysAgo, "es-ES", now)).toBe(
      "hace 3 días",
    );
    expect(formatRelativeTime(threeDaysAgo, "en-US", now)).toBe("3 days ago");
  });

  it("falls back to the absolute date for invalid values", () => {
    expect(formatRelativeTime("not-a-date", "es-ES", now)).toBe("not-a-date");
  });
});
