import { describe, expect, it } from "@jest/globals";

import {
  INITIAL_REVISION,
  nextRevision,
  readStoredRevision,
} from "../revision";

describe("revision helpers", () => {
  it("starts at zero", () => {
    expect(INITIAL_REVISION).toBe(0);
  });

  it("reads a stored revision", () => {
    expect(readStoredRevision({ revision: 7 })).toBe(7);
    expect(readStoredRevision({ revision: 0 })).toBe(0);
  });

  it("treats a legacy document without the field as zero", () => {
    expect(readStoredRevision({})).toBe(0);
    expect(readStoredRevision(null)).toBe(0);
    expect(readStoredRevision(undefined)).toBe(0);
  });

  it("normalizes invalid and negative values to zero", () => {
    expect(readStoredRevision({ revision: -3 })).toBe(0);
    expect(readStoredRevision({ revision: "4" })).toBe(0);
    expect(readStoredRevision({ revision: Number.NaN })).toBe(0);
    expect(readStoredRevision({ revision: Number.POSITIVE_INFINITY })).toBe(0);
    expect(readStoredRevision({ revision: 1.5 })).toBe(0);
    expect(readStoredRevision({ revision: null })).toBe(0);
  });

  it("writes one more than the stored revision", () => {
    expect(nextRevision({ revision: 7 })).toBe(8);
    expect(nextRevision({})).toBe(1);
    expect(nextRevision(null)).toBe(1);
    expect(nextRevision({ revision: -3 })).toBe(1);
  });

  it("reads the revision of a mapped entity", () => {
    const wallet = { id: "wallet-1", revision: 2 };

    expect(nextRevision(wallet)).toBe(3);
  });
});
