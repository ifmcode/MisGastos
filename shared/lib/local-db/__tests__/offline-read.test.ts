import { describe, expect, it } from "@jest/globals";

import {
  assertServerSnapshot,
  OFFLINE_READ_CODE,
  OfflineReadError,
} from "../offline-read";

describe("assertServerSnapshot", () => {
  it("accepts a server snapshot", () => {
    expect(() =>
      assertServerSnapshot({ metadata: { fromCache: false } }),
    ).not.toThrow();
  });

  it("accepts a snapshot without metadata", () => {
    expect(() => assertServerSnapshot({})).not.toThrow();
  });

  it("rejects a cached snapshot that carries no documents", () => {
    expect(() =>
      assertServerSnapshot({ metadata: { fromCache: true }, size: 0 }),
    ).toThrow(OfflineReadError);
  });

  it("accepts a cached snapshot with documents", () => {
    expect(() =>
      assertServerSnapshot({ metadata: { fromCache: true }, size: 3 }),
    ).not.toThrow();
  });

  it("exposes a stable code instead of a user-facing sentence", () => {
    expect(new OfflineReadError().code).toBe(OFFLINE_READ_CODE);
    expect(new OfflineReadError().message).toBe(OFFLINE_READ_CODE);
  });
});
