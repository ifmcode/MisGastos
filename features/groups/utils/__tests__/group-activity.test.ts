import { describe, expect, it } from "@jest/globals";

import {
  clampGroupActivityLimit,
  collectGroupMetadataChanges,
} from "../group-activity";

describe("clampGroupActivityLimit", () => {
  it("defaults a missing or malformed value to 20", () => {
    expect(clampGroupActivityLimit(undefined)).toBe(20);
    expect(clampGroupActivityLimit(null)).toBe(20);
    expect(clampGroupActivityLimit("10")).toBe(20);
    expect(clampGroupActivityLimit(Number.NaN)).toBe(20);
  });

  it("clamps to 1..50 and floors decimals", () => {
    expect(clampGroupActivityLimit(0)).toBe(1);
    expect(clampGroupActivityLimit(-4)).toBe(1);
    expect(clampGroupActivityLimit(7.9)).toBe(7);
    expect(clampGroupActivityLimit(51)).toBe(50);
  });
});

describe("collectGroupMetadataChanges", () => {
  const previous = {
    name: "Viaje",
    description: null,
    defaultCurrency: "EUR" as const,
  };

  it("reports only the fields that changed, in a stable order", () => {
    expect(
      collectGroupMetadataChanges(previous, {
        name: "Viaje Nuevo",
        description: "Finde",
        defaultCurrency: "USD",
      }),
    ).toEqual(["name", "description", "defaultCurrency"]);
  });

  it("returns an empty list when nothing changed", () => {
    expect(collectGroupMetadataChanges(previous, { ...previous })).toEqual([]);
  });
});
