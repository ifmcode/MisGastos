import { describe, expect, it } from "@jest/globals";

import { getGroupDetailStatus } from "../group-detail-status";

describe("getGroupDetailStatus", () => {
  it("reports missing before anything else, even with a cached error", () => {
    expect(
      getGroupDetailStatus(
        { missing: true, loading: false, error: "boom" },
        true,
      ),
    ).toBe("missing");
  });

  it("reports ready as soon as the detail is loaded", () => {
    expect(
      getGroupDetailStatus({ missing: false, loading: true, error: null }, true),
    ).toBe("ready");
  });

  it("reports loading before the first error", () => {
    expect(
      getGroupDetailStatus(
        { missing: false, loading: true, error: "boom" },
        false,
      ),
    ).toBe("loading");
  });

  it("reports the error once the load finished without a detail", () => {
    expect(
      getGroupDetailStatus(
        { missing: false, loading: false, error: "boom" },
        false,
      ),
    ).toBe("error");
  });

  it("falls back to missing when nothing loaded and nothing failed", () => {
    expect(
      getGroupDetailStatus(
        { missing: false, loading: false, error: null },
        false,
      ),
    ).toBe("missing");
  });
});
