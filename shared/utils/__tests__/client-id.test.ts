import { describe, expect, it } from "@jest/globals";

import { createClientId, readClientDocumentId } from "../client-id";

describe("readClientDocumentId", () => {
  it("returns a trimmed client id", () => {
    expect(readClientDocumentId("  wallet-1  ")).toBe("wallet-1");
  });

  it("ignores empty, blank and non-string values", () => {
    expect(readClientDocumentId("")).toBeNull();
    expect(readClientDocumentId("   ")).toBeNull();
    expect(readClientDocumentId(undefined)).toBeNull();
    expect(readClientDocumentId(null)).toBeNull();
    expect(readClientDocumentId(42)).toBeNull();
  });
});

describe("createClientId", () => {
  it("returns a Firestore-safe id of at most 20 characters", () => {
    const id = createClientId();

    expect(id.length).toBeGreaterThan(0);
    expect(id.length).toBeLessThanOrEqual(20);
    expect(id).toMatch(/^[A-Za-z0-9]+$/);
    expect(id).not.toContain("/");
  });

  it("returns a different id on every call", () => {
    const ids = new Set(Array.from({ length: 1000 }, () => createClientId()));

    expect(ids.size).toBe(1000);
  });
});
