import { describe, expect, it } from "@jest/globals";

import {
  getDateQuickOptions,
  getLastUsedDateOption,
} from "../date-quick-options";

describe("getDateQuickOptions", () => {
  it("returns today and yesterday as local DD/MM values", () => {
    const options = getDateQuickOptions(new Date(2026, 10, 2, 12));

    expect(options.today).toEqual({
      key: "today",
      label: "Hoy",
      isoDate: "2026-11-02",
      displayDate: "02/11",
    });
    expect(options.yesterday).toEqual({
      key: "yesterday",
      label: "Ayer",
      isoDate: "2026-11-01",
      displayDate: "01/11",
    });
  });

  it("handles month and year boundaries", () => {
    const options = getDateQuickOptions(new Date(2026, 0, 1, 12));

    expect(options.yesterday.isoDate).toBe("2025-12-31");
    expect(options.yesterday.displayDate).toBe("31/12");
  });

  it("handles leap days", () => {
    const options = getDateQuickOptions(new Date(2024, 2, 1, 12));

    expect(options.yesterday.isoDate).toBe("2024-02-29");
    expect(options.yesterday.displayDate).toBe("29/02");
  });
});

describe("getLastUsedDateOption", () => {
  const reference = new Date(2026, 10, 2, 12);

  it("returns the last used date formatted as DD/MM", () => {
    expect(getLastUsedDateOption("2026-10-30", reference)).toEqual({
      key: "last",
      label: "Último",
      isoDate: "2026-10-30",
      displayDate: "30/10",
    });
  });

  it("accepts a DD/MM/YYYY value", () => {
    expect(getLastUsedDateOption("30/10/2026", reference)?.isoDate).toBe(
      "2026-10-30",
    );
  });

  it("hides dates already covered by Hoy or Ayer", () => {
    expect(getLastUsedDateOption("2026-11-02", reference)).toBeNull();
    expect(getLastUsedDateOption("2026-11-01", reference)).toBeNull();
  });

  it("returns null for empty or invalid values", () => {
    expect(getLastUsedDateOption(null, reference)).toBeNull();
    expect(getLastUsedDateOption("", reference)).toBeNull();
    expect(getLastUsedDateOption("2026-02-30", reference)).toBeNull();
  });
});
