import { describe, expect, it } from "@jest/globals";

import {
  getVisibleGroupSplitModes,
  VISIBLE_GROUP_SPLIT_MODES,
} from "../group-expense-split-modes";

describe("getVisibleGroupSplitModes", () => {
  it("offers only equal and fixed for the visible modes", () => {
    expect(VISIBLE_GROUP_SPLIT_MODES).toEqual(["equal", "fixed"]);
    expect(getVisibleGroupSplitModes("equal")).toEqual(["equal", "fixed"]);
    expect(getVisibleGroupSplitModes("fixed")).toEqual(["equal", "fixed"]);
  });

  it("keeps a stored percentage expense selectable in canonical order", () => {
    expect(getVisibleGroupSplitModes("percentage")).toEqual([
      "equal",
      "percentage",
      "fixed",
    ]);
  });

  it("keeps a stored shares expense selectable in canonical order", () => {
    expect(getVisibleGroupSplitModes("shares")).toEqual([
      "equal",
      "fixed",
      "shares",
    ]);
  });

  it("returns the same visible list for a normal mode", () => {
    expect(getVisibleGroupSplitModes("fixed")).toBe(VISIBLE_GROUP_SPLIT_MODES);
  });
});
