import { describe, expect, it } from "@jest/globals";

import { resolveRefreshFailure } from "../async-collection-refresh";

describe("resolveRefreshFailure", () => {
  it("keeps the data already on screen, cache or not", () => {
    expect(resolveRefreshFailure(["shown"], ["cached"])).toEqual({
      action: "keep",
    });
    expect(resolveRefreshFailure(["shown"], null)).toEqual({ action: "keep" });
  });

  it("falls back to the cache when the screen is empty", () => {
    expect(resolveRefreshFailure([], ["cached"])).toEqual({
      action: "use-cache",
      items: ["cached"],
    });
  });

  it("treats a fetched-but-empty cache as valid data", () => {
    expect(resolveRefreshFailure([], [])).toEqual({
      action: "use-cache",
      items: [],
    });
  });

  it("reports the error only when there is nothing to show", () => {
    expect(resolveRefreshFailure([], null)).toEqual({
      action: "report-error",
    });
  });
});
