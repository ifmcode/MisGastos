import { describe, expect, it } from "@jest/globals";

import {
  getBannerBottomOffset,
  isTabRoute,
  TAB_BAR_HEIGHT,
} from "../banner-offset";

describe("isTabRoute", () => {
  it("recognises the five tab routes", () => {
    for (const route of [
      "/",
      "/wallets",
      "/transactions",
      "/social",
      "/settings",
    ]) {
      expect(isTabRoute(route)).toBe(true);
    }
  });

  it("rejects pushed screens and unknown paths", () => {
    expect(isTabRoute("/transfers")).toBe(false);
    expect(isTabRoute("/social/groups/abc")).toBe(false);
    expect(isTabRoute("/categories")).toBe(false);
  });
});

describe("getBannerBottomOffset", () => {
  it("sits on top of the tab bar on a tab route", () => {
    expect(
      getBannerBottomOffset({ isTabRoute: true, bottomInset: 34 }),
    ).toBe(34 + TAB_BAR_HEIGHT);
  });

  it("sits above the bottom safe area on any other route", () => {
    expect(
      getBannerBottomOffset({ isTabRoute: false, bottomInset: 34 }),
    ).toBe(34);
    expect(
      getBannerBottomOffset({ isTabRoute: false, bottomInset: 0 }),
    ).toBe(0);
  });
});
