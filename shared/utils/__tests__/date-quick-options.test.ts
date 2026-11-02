import { describe, expect, it } from "@jest/globals";

import { getDateQuickOptions } from "../date-quick-options";

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
