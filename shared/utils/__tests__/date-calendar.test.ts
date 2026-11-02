import type { CalendarDay } from "../date-calendar";
import {
  buildCalendarMonth,
  calendarMonthFromIso,
  formatMonthLabel,
  shiftCalendarMonth,
} from "../date-calendar";

function daysOf(weeks: Array<Array<CalendarDay | null>>): CalendarDay[] {
  return weeks.flat().filter((day): day is CalendarDay => day !== null);
}

describe("buildCalendarMonth", () => {
  it("starts weeks on Monday with leading blanks", () => {
    const month = buildCalendarMonth(2026, 10);

    expect(month.label).toBe("Noviembre 2026");
    expect(month.weeks[0]).toEqual([
      null,
      null,
      null,
      null,
      null,
      null,
      { day: 1, isoDate: "2026-11-01" },
    ]);
  });

  it("includes every day of the month in full weeks", () => {
    const month = buildCalendarMonth(2026, 10);
    const days = daysOf(month.weeks);

    expect(days).toHaveLength(30);
    expect(days[0].isoDate).toBe("2026-11-01");
    expect(days[29].isoDate).toBe("2026-11-30");
    month.weeks.forEach((week) => expect(week).toHaveLength(7));
  });

  it("handles leap years", () => {
    const february = buildCalendarMonth(2028, 1);
    const days = daysOf(february.weeks);

    expect(days).toHaveLength(29);
    expect(days[28].isoDate).toBe("2028-02-29");
  });
});

describe("shiftCalendarMonth", () => {
  it("rolls over the year boundary", () => {
    expect(shiftCalendarMonth(2026, 11, 1)).toEqual({ year: 2027, month: 0 });
    expect(shiftCalendarMonth(2026, 0, -1)).toEqual({ year: 2025, month: 11 });
  });
});

describe("calendarMonthFromIso", () => {
  it("uses the month of the ISO date", () => {
    expect(calendarMonthFromIso("2026-03-14")).toEqual({
      year: 2026,
      month: 2,
    });
  });

  it("falls back when the value is invalid", () => {
    expect(calendarMonthFromIso("", new Date(2026, 6, 1))).toEqual({
      year: 2026,
      month: 6,
    });
  });
});

describe("formatMonthLabel", () => {
  it("capitalizes Spanish month names", () => {
    expect(formatMonthLabel(2026, 0)).toBe("Enero 2026");
    expect(formatMonthLabel(2026, 11)).toBe("Diciembre 2026");
  });
});
