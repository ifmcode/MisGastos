import { afterEach, describe, expect, it } from "@jest/globals";

import {
  allowOwnerLocalWrites,
  isOwnerLocalWritesRevoked,
  revokeOwnerLocalWrites,
} from "../owner-revocation";

afterEach(() => {
  allowOwnerLocalWrites("owner-1");
  allowOwnerLocalWrites("owner-2");
});

describe("owner revocation", () => {
  it("revokes and lifts the writes of one account", () => {
    expect(isOwnerLocalWritesRevoked("owner-1")).toBe(false);

    revokeOwnerLocalWrites("owner-1");
    expect(isOwnerLocalWritesRevoked("owner-1")).toBe(true);

    allowOwnerLocalWrites("owner-1");
    expect(isOwnerLocalWritesRevoked("owner-1")).toBe(false);
  });

  it("keeps accounts independent", () => {
    revokeOwnerLocalWrites("owner-1");

    expect(isOwnerLocalWritesRevoked("owner-2")).toBe(false);
  });

  it("tolerates repeated revocations and lifts", () => {
    revokeOwnerLocalWrites("owner-1");
    revokeOwnerLocalWrites("owner-1");
    expect(isOwnerLocalWritesRevoked("owner-1")).toBe(true);

    allowOwnerLocalWrites("owner-1");
    allowOwnerLocalWrites("owner-1");
    expect(isOwnerLocalWritesRevoked("owner-1")).toBe(false);
  });
});
