import { describe, expect, it } from "@jest/globals";

import { readClientDocumentId } from "../client-id";

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
