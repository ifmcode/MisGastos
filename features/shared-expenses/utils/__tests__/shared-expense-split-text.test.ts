import { describe, expect, it } from "@jest/globals";

import {
  canReuseSplitValues,
  formatBpsText,
  formatCentsText,
  getDefaultSplitValues,
} from "../shared-expense-split-text";

describe("formatCentsText", () => {
  it("renders integer cents as decimal text", () => {
    expect(formatCentsText(1250)).toBe("12.50");
    expect(formatCentsText(0)).toBe("0.00");
    expect(formatCentsText(-105)).toBe("-1.05");
  });

  it("settles malformed cents at zero", () => {
    expect(formatCentsText(Number.NaN)).toBe("0.00");
    expect(formatCentsText(999.6)).toBe("10.00");
  });
});

describe("formatBpsText", () => {
  it("drops decimals when the percentage is a round number", () => {
    expect(formatBpsText(5000)).toBe("50");
    expect(formatBpsText(10000)).toBe("100");
  });

  it("keeps one or two decimals when needed", () => {
    expect(formatBpsText(1250)).toBe("12.5");
    expect(formatBpsText(3333)).toBe("33.33");
  });
});

describe("getDefaultSplitValues", () => {
  it("needs no values for equal splits", () => {
    expect(getDefaultSplitValues("equal", "10", ["user-a", "user-b"])).toEqual(
      {},
    );
  });

  it("splits percentages in hundredths of a percent", () => {
    expect(
      getDefaultSplitValues("percentage", "10", ["user-a", "user-b"]),
    ).toEqual({ "user-a": "50", "user-b": "50" });

    expect(
      getDefaultSplitValues("percentage", "10", ["user-a", "user-b", "user-c"]),
    ).toEqual({ "user-a": "33.34", "user-b": "33.33", "user-c": "33.33" });
  });

  it("derives fixed amounts from the current total", () => {
    expect(getDefaultSplitValues("fixed", "10", ["user-a", "user-b"])).toEqual({
      "user-a": "5.00",
      "user-b": "5.00",
    });

    expect(getDefaultSplitValues("fixed", "10.01", ["user-a", "user-b"])).toEqual(
      { "user-a": "5.01", "user-b": "5.00" },
    );
  });

  it("falls back to zero when the amount is missing", () => {
    expect(getDefaultSplitValues("fixed", "", ["user-a", "user-b"])).toEqual({
      "user-a": "0.00",
      "user-b": "0.00",
    });
  });

  it("starts every share weight at one", () => {
    expect(getDefaultSplitValues("shares", "10", ["user-a", "user-b"])).toEqual({
      "user-a": "1",
      "user-b": "1",
    });
  });

  it("returns an empty map without participants", () => {
    expect(getDefaultSplitValues("fixed", "10", [])).toEqual({});
  });
});

describe("canReuseSplitValues", () => {
  const ids = ["user-a", "user-b"];

  it("always accepts the equal mode", () => {
    expect(canReuseSplitValues("equal", "10", ids, {})).toBe(true);
  });

  it("keeps percentages that add up to 100", () => {
    expect(
      canReuseSplitValues("percentage", "10", ids, {
        "user-a": "60",
        "user-b": "40",
      }),
    ).toBe(true);
    expect(
      canReuseSplitValues("percentage", "10", ids, {
        "user-a": "60",
        "user-b": "30",
      }),
    ).toBe(false);
  });

  it("requires fixed values to match the current total", () => {
    const values = { "user-a": "5.00", "user-b": "5.00" };

    expect(canReuseSplitValues("fixed", "10", ids, values)).toBe(true);
    expect(canReuseSplitValues("fixed", "12", ids, values)).toBe(false);
  });

  it("requires the share weights to add up to at least one", () => {
    expect(
      canReuseSplitValues("shares", "10", ids, {
        "user-a": "0",
        "user-b": "0",
      }),
    ).toBe(false);
    expect(
      canReuseSplitValues("shares", "10", ids, {
        "user-a": "1",
        "user-b": "0",
      }),
    ).toBe(true);
  });

  it("rejects values without a valid amount", () => {
    expect(
      canReuseSplitValues("shares", "", ids, {
        "user-a": "1",
        "user-b": "1",
      }),
    ).toBe(false);
  });
});
